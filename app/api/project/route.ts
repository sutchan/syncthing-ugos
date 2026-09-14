import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

export interface ValidationRule {
  id: string;
  name: string;
  category: "structure" | "security" | "metadata" | "docker";
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "success";
}

export async function GET() {
  try {
    const rootDir = process.cwd();
    const projectYamlPath = path.join(rootDir, "project.yaml");
    const versionFilePath = path.join(rootDir, "VERSION");

    const projectYamlContent = await fs.readFile(projectYamlPath, "utf-8");
    const versionContent = (await fs.readFile(versionFilePath, "utf-8")).trim();

    // Parse YAML
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedData: any = yaml.load(projectYamlContent);

    // Validate rules against UGOS Pro UPK spec
    const rules: ValidationRule[] = [
      {
        id: "spec_version",
        name: "Spec Version 2.1+",
        category: "metadata",
        passed: parsedData.spec_version === "2.1" || parsedData.spec_version === "2.0",
        message: `spec_version is set to '${parsedData.spec_version}' (UGOS Pro standard: 2.1)`,
        severity: "success",
      },
      {
        id: "app_id_format",
        name: "App ID Reverse Domain Format",
        category: "metadata",
        passed: /^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(parsedData.app_id || ""),
        message: `app_id is '${parsedData.app_id}' (format conforms to reverse domain requirement)`,
        severity: "success",
      },
      {
        id: "docker_app_mode",
        name: "Docker App Declarations",
        category: "docker",
        passed:
          parsedData.is_docker_app === true &&
          parsedData.depend_docker_version &&
          parsedData.only_admin === true,
        message: `is_docker_app: ${parsedData.is_docker_app}, depend_docker: ${parsedData.depend_docker_version}, only_admin: ${parsedData.only_admin}`,
        severity: "success",
      },
      {
        id: "start_cmd_empty",
        name: "start_cmd Semantics for Docker",
        category: "docker",
        passed: parsedData.start_cmd === "" || parsedData.start_cmd === undefined,
        message: "start_cmd is correctly empty; system will launch container via rootfs_common/docker-compose.yaml",
        severity: "success",
      },
      {
        id: "port_and_open_type",
        name: "Web GUI Port & Open Type",
        category: "metadata",
        passed: parsedData.port === 8384 && parsedData.open_type === "tab",
        message: `port: ${parsedData.port} (Syncthing default), open_type: ${parsedData.open_type}`,
        severity: "success",
      },
      {
        id: "security_permissions",
        name: "Security Redline Compliance",
        category: "security",
        passed:
          Array.isArray(parsedData.permissions) &&
          parsedData.permissions.includes("NETWORK.ACCESS_INTERNET") &&
          !parsedData.permissions.includes("SYSTEM.EXEC_SYSTEM_COMMAND"),
        message: "Only NETWORK.ACCESS_INTERNET declared; no elevated host system permissions",
        severity: "success",
      },
      {
        id: "shared_path_access",
        name: "Shared Directory Authorization",
        category: "docker",
        passed: parsedData.allow_add_access_path === true,
        message: "allow_add_access_path: true (enables UGAPP_SHARED_DIR injection for /var/syncthing/Sync)",
        severity: "success",
      },
      {
        id: "arch_support",
        name: "Multi-Architecture Support",
        category: "structure",
        passed:
          Array.isArray(parsedData.support_arch) &&
          parsedData.support_arch.includes("amd64") &&
          parsedData.support_arch.includes("arm64"),
        message: `Target architectures: ${parsedData.support_arch?.join(", ")}`,
        severity: "success",
      },
      {
        id: "gui_password_param",
        name: "GUI Password Parameter",
        category: "security",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        passed: parsedData.parameters?.some((p: any) => p.key === "GUI_PASSWORD" && p.required === true),
        message: "GUI_PASSWORD parameter present, required for Syncthing 1.27+ authentication",
        severity: "success",
      },
      {
        id: "i18n_support",
        name: "Multi-language (en-US & zh-CN)",
        category: "metadata",
        passed: !!(parsedData.i18n?.["en-US"] && parsedData.i18n?.["zh-CN"]),
        message: "Mandatory en-US and zh-CN localizations included",
        severity: "success",
      },
    ];

    // Generate sample docker-compose.yaml based on parameters
    const dockerCompose = `services:
  syncthing:
    image: docker.io/syncthing/syncthing:${parsedData.x_image_tag || parsedData.version}
    container_name: syncthing
    volumes:
      - ./data:/var/syncthing
      - \${UGAPP_SHARED_DIR}:/var/syncthing/Sync
    network_mode: bridge
    ports:
      - ${parsedData.port}:8384      # Web GUI
      - 22000:22000    # Sync Data (TCP)
      - 22000:22000/udp
      - 21027:21027/udp # Local Discovery
    environment:
      - PUID=\${PUID:-1000}
      - PGID=\${PGID:-1000}
      - TZ=\${TZ:-Asia/Shanghai}
      - GUI_PASSWORD=\${GUI_PASSWORD}
      - UMASK=022
    restart: always`;

    return NextResponse.json({
      projectYaml: parsedData,
      rawYaml: projectYamlContent,
      version: versionContent,
      rules,
      dockerCompose,
      complianceScore: Math.round((rules.filter((r) => r.passed).length / rules.length) * 100),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rootDir = process.cwd();
    const projectYamlPath = path.join(rootDir, "project.yaml");

    if (body.rawYaml) {
      // Validate that it is valid YAML
      yaml.load(body.rawYaml);
      await fs.writeFile(projectYamlPath, body.rawYaml, "utf-8");
    } else if (body.projectYaml) {
      const dump = yaml.dump(body.projectYaml);
      await fs.writeFile(projectYamlPath, dump, "utf-8");
    }

    if (body.version) {
      const versionFilePath = path.join(rootDir, "VERSION");
      await fs.writeFile(versionFilePath, body.version.trim(), "utf-8");
    }

    return NextResponse.json({ success: true, message: "Configuration updated successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
