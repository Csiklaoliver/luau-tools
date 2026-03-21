import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as os from "os";
import type { Ora } from "ora";

const GITHUB_API_RELEASES =
  "https://api.github.com/repos/JohnnyMorganz/luau-lsp/releases";
export const BIN_DIR = path.join(os.homedir(), ".luau-tools", "bin");
const VERSION_FILE = path.join(os.homedir(), ".luau-tools", "version.json");

export interface LspVersion {
  version: string;
  downloadedAt: string;
  platform: string;
}

export interface GithubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GithubRelease {
  tag_name: string;
  name: string;
  assets: GithubAsset[];
}

function getPlatformAssetName(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "win32") {
    return "luau-lsp-win64.zip";
  } else if (platform === "darwin") {
    if (arch === "arm64") {
      return "luau-lsp-macos-arm64.zip";
    }
    return "luau-lsp-macos-x86_64.zip";
  } else {
    return "luau-lsp-linux-x86_64.zip";
  }
}

function getBinaryName(): string {
  return process.platform === "win32" ? "luau-lsp.exe" : "luau-lsp";
}

export function getBinaryPath(): string {
  return path.join(BIN_DIR, getBinaryName());
}

async function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "luau-tools-cli/0.1.0",
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
              `GitHub API returned ${res.statusCode} for ${url}.\n` +
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
            reject(new Error(`Failed to parse JSON: ${String(e)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

export async function downloadFileWithProgress(
  url: string,
  destPath: string,
  spinner: Ora
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    const request = (reqUrl: string): void => {
      https.get(
        reqUrl,
        { headers: { "User-Agent": "luau-tools-cli/0.1.0" } },
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
            if (total > 0) {
              const pct = Math.round((downloaded / total) * 100);
              spinner.text = `Downloading luau-lsp... ${pct}% (${formatBytes(downloaded)} / ${formatBytes(total)})`;
            } else {
              spinner.text = `Downloading luau-lsp... ${formatBytes(downloaded)}`;
            }
          });

          res.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
          res.on("error", reject);
        }
      );
    };

    file.on("error", (err) => {
      fs.unlink(destPath, () => undefined);
      reject(err);
    });

    request(url);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
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

export async function getLatestRelease(): Promise<GithubRelease> {
  const releases = await fetchJson<GithubRelease[]>(
    `${GITHUB_API_RELEASES}?per_page=1`
  );
  if (!releases || releases.length === 0) {
    throw new Error("No releases found for luau-lsp on GitHub.");
  }
  return releases[0];
}

export async function getRelease(version: string): Promise<GithubRelease> {
  return fetchJson<GithubRelease>(
    `https://api.github.com/repos/JohnnyMorganz/luau-lsp/releases/tags/${version}`
  );
}

export function getCachedVersion(): LspVersion | null {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      const raw = fs.readFileSync(VERSION_FILE, "utf-8");
      return JSON.parse(raw) as LspVersion;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveCachedVersion(version: string): void {
  const info: LspVersion = {
    version,
    downloadedAt: new Date().toISOString(),
    platform: `${process.platform}-${process.arch}`,
  };
  fs.mkdirSync(path.dirname(VERSION_FILE), { recursive: true });
  fs.writeFileSync(VERSION_FILE, JSON.stringify(info, null, 2));
}

export async function downloadLuauLsp(
  version: string,
  spinner: Ora
): Promise<string> {
  const release =
    version === "latest"
      ? await getLatestRelease()
      : await getRelease(version);

  const assetName = getPlatformAssetName();
  const asset = release.assets.find((a) => a.name === assetName);

  if (!asset) {
    const available = release.assets.map((a) => a.name).join(", ");
    throw new Error(
      `No binary available for your platform (${process.platform}/${process.arch}).\n` +
        `Available: ${available}\n` +
        `Please open an issue at https://github.com/csiklaoliver/luau-tools/issues`
    );
  }

  fs.mkdirSync(BIN_DIR, { recursive: true });
  const zipPath = path.join(BIN_DIR, assetName);

  spinner.text = `Downloading luau-lsp ${release.tag_name}...`;
  await downloadFileWithProgress(asset.browser_download_url, zipPath, spinner);

  spinner.text = "Extracting...";
  await extractZip(zipPath, BIN_DIR);
  fs.unlinkSync(zipPath);

  const binaryPath = getBinaryPath();
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `Binary not found at ${binaryPath} after extraction.\n` +
        `Please report this at https://github.com/csiklaoliver/luau-tools/issues`
    );
  }

  if (process.platform !== "win32") {
    fs.chmodSync(binaryPath, 0o755);
  }

  saveCachedVersion(release.tag_name);
  return binaryPath;
}

export async function ensureLuauLsp(spinner: Ora, forceVersion?: string): Promise<string> {
  const version = forceVersion ?? "latest";
  const binaryPath = getBinaryPath();
  const cached = getCachedVersion();

  if (cached && fs.existsSync(binaryPath)) {
    if (version === "latest" || cached.version === version) {
      return binaryPath;
    }
  }

  return downloadLuauLsp(version, spinner);
}
