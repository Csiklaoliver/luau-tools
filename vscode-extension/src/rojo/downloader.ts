import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";

const ROJO_RELEASES_API =
  "https://api.github.com/repos/rojo-rbx/rojo/releases/latest";
const BIN_DIR = path.join(os.homedir(), ".luau-tools", "bin");
const ROJO_VERSION_FILE = path.join(
  os.homedir(),
  ".luau-tools",
  "rojo-version.json"
);

export interface RojoVersion {
  version: string;
  downloadedAt: string;
  platform: string;
}

interface GithubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GithubRelease {
  tag_name: string;
  assets: GithubAsset[];
}

function getPlatformAssetName(version: string): string {
  const platform = process.platform;
  const arch = process.arch;
  // Rojo release asset names: rojo-VERSION-win64.zip, rojo-VERSION-macos-arm64.zip, etc.
  const ver = version.replace(/^v/, "");
  if (platform === "win32") {
    return `rojo-${ver}-win64.zip`;
  } else if (platform === "darwin") {
    if (arch === "arm64") {
      return `rojo-${ver}-macos-arm64.zip`;
    }
    return `rojo-${ver}-macos-x86_64.zip`;
  } else {
    return `rojo-${ver}-linux-x86_64.zip`;
  }
}

function getRojoBinaryName(): string {
  return process.platform === "win32" ? "rojo.exe" : "rojo";
}

export function getRojoBinaryPath(): string {
  return path.join(BIN_DIR, getRojoBinaryName());
}

async function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "luau-tools-vscode/0.1.0",
          Accept: "application/vnd.github.v3+json",
        },
      },
      (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            fetchJson<T>(location).then(resolve).catch(reject);
            return;
          }
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(
            new Error(
              `GitHub API returned HTTP ${res.statusCode}.\n` +
                `If you are being rate limited, wait a few minutes and try again.`
            )
          );
          return;
        }
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch (e) {
            reject(new Error(`Failed to parse GitHub response: ${String(e)}`));
          }
        });
      }
    ).on("error", reject);
  });
}

async function downloadFile(
  url: string,
  destPath: string,
  progress?: vscode.Progress<{ message?: string; increment?: number }>,
  label?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    const request = (reqUrl: string): void => {
      https.get(
        reqUrl,
        { headers: { "User-Agent": "luau-tools-vscode/0.1.0" } },
        (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            const location = res.headers.location;
            if (location) {
              request(location);
              return;
            }
          }
          const total = parseInt(res.headers["content-length"] ?? "0", 10);
          let downloaded = 0;

          res.on("data", (chunk: Buffer) => {
            downloaded += chunk.length;
            if (progress && total > 0) {
              const pct = Math.round((downloaded / total) * 80);
              progress.report({
                message: `${label ?? "Downloading"}... ${pct}%`,
                increment: pct,
              });
            }
          });

          res.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
          res.on("error", reject);
        }
      ).on("error", reject);
    };

    file.on("error", (err) => {
      fs.unlink(destPath, () => undefined);
      reject(err);
    });

    request(url);
  });
}

async function extractZip(zipPath: string, destDir: string): Promise<void> {
  const { execFile } = await import("child_process");
  const { promisify } = await import("util");
  const execFileAsync = promisify(execFile);

  if (process.platform === "win32") {
    await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -Force -Path "${zipPath}" -DestinationPath "${destDir}"`,
    ]);
  } else {
    await execFileAsync("unzip", ["-o", zipPath, "-d", destDir]);
  }
}

export function getCachedRojoVersion(): RojoVersion | null {
  try {
    if (fs.existsSync(ROJO_VERSION_FILE)) {
      const raw = fs.readFileSync(ROJO_VERSION_FILE, "utf-8");
      return JSON.parse(raw) as RojoVersion;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveCachedRojoVersion(version: string): void {
  const info: RojoVersion = {
    version,
    downloadedAt: new Date().toISOString(),
    platform: `${process.platform}-${process.arch}`,
  };
  fs.mkdirSync(path.dirname(ROJO_VERSION_FILE), { recursive: true });
  fs.writeFileSync(ROJO_VERSION_FILE, JSON.stringify(info, null, 2));
}

export async function downloadRojo(
  progress?: vscode.Progress<{ message?: string; increment?: number }>
): Promise<string> {
  progress?.report({ message: "Fetching latest Rojo release info...", increment: 0 });

  const release = await fetchJson<GithubRelease>(ROJO_RELEASES_API);
  const version = release.tag_name;
  const assetName = getPlatformAssetName(version);
  const asset = release.assets.find((a) => a.name === assetName);

  if (!asset) {
    const available = release.assets.map((a) => a.name).join(", ");
    throw new Error(
      `No Rojo binary found for your platform (${process.platform}/${process.arch}).\n` +
        `Available assets: ${available}\n\n` +
        `You can install Rojo manually from:\n` +
        `https://github.com/rojo-rbx/rojo/releases\n\n` +
        `Then set luau-tools.rojo.rojoPath to point to your binary.`
    );
  }

  fs.mkdirSync(BIN_DIR, { recursive: true });
  const zipPath = path.join(BIN_DIR, assetName);

  progress?.report({
    message: `Downloading Rojo ${version}...`,
    increment: 5,
  });

  await downloadFile(
    asset.browser_download_url,
    zipPath,
    progress,
    `Downloading Rojo ${version}`
  );

  progress?.report({ message: "Extracting Rojo...", increment: 85 });
  await extractZip(zipPath, BIN_DIR);
  fs.unlinkSync(zipPath);

  const binaryPath = getRojoBinaryPath();
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `Rojo extraction succeeded but binary was not found at ${binaryPath}.\n` +
        `Please report this at https://github.com/csiklaoliver/luau-tools/issues`
    );
  }

  if (process.platform !== "win32") {
    fs.chmodSync(binaryPath, 0o755);
  }

  saveCachedRojoVersion(version);
  progress?.report({ message: `Rojo ${version} ready`, increment: 100 });

  return binaryPath;
}

export async function ensureRojo(
  progress?: vscode.Progress<{ message?: string; increment?: number }>
): Promise<string> {
  // Check for custom path override first
  const customPath = vscode.workspace
    .getConfiguration("luau-tools")
    .get<string>("rojo.rojoPath");

  if (customPath && customPath.length > 0) {
    if (!fs.existsSync(customPath)) {
      throw new Error(
        `Custom Rojo path does not exist: ${customPath}\n` +
          `Check your luau-tools.rojo.rojoPath setting.`
      );
    }
    return customPath;
  }

  const binaryPath = getRojoBinaryPath();
  const cached = getCachedRojoVersion();

  if (cached && fs.existsSync(binaryPath)) {
    return binaryPath;
  }

  return downloadRojo(progress);
}
