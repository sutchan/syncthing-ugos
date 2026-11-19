import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    "build/project-meta.sh",
    "build/preflight.sh",
    "build/assemble.sh",
    "build/build-all.sh",
    "build/export-images.sh",
]

errors = []
for rel in FILES:
    data = (ROOT / rel).read_bytes()
    text = data.decode("utf-8")
    crlf = data.count(b"\r\n")
    if crlf:
        errors.append(f"{rel}: 含 {crlf} 处 CRLF 行尾（bash heredoc 会出错）")
    # heredoc 起点/终点配对
    starts = len(re.findall(r"<<'PY'", text))
    ends = len(re.findall(r"^PY$", text, re.M))
    if starts != ends:
        errors.append(f"{rel}: heredoc 起点 {starts} != 终点 {ends}")
    # 引号粗检：每行双引号数量为偶数（忽略注释行的简单统计会不准，仅统计含 \$ 的 sed 行）
    for i, line in enumerate(text.splitlines(), 1):
        if line.count('"') % 2 != 0 and not line.lstrip().startswith("#"):
            errors.append(f"{rel}:{i}: 双引号数量为奇数 -> {line.strip()}")
    print(f"CHECKED {rel}: lines={len(text.splitlines())}, heredoc={starts}/{ends}, crlf={crlf}")

if errors:
    print("\n[FAIL] 发现问题:")
    for e in errors:
        print("  -", e)
    sys.exit(1)
print("\n[OK] 静态检查全部通过")
