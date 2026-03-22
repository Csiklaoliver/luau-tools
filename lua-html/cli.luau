--[[
  lua-html CLI
  Usage: lune run cli.luau <input.luau> [output.html]

  If no output path is given, it's inferred from the input filename.
  Example:
    lune run cli.luau examples/landing.luau
    lune run cli.luau examples/hello.luau dist/index.html
]]

local process = require("@lune/process")
local fs      = require("@lune/fs")

local args = process.args

if #args < 1 then
	print("Usage: lune run cli.luau <input.luau> [output.html]")
	process.exit(1)
end

local inputPath  = args[1]
local outputPath = args[2]

if not outputPath then
	-- Replace .luau / .lua extension with .html
	outputPath = inputPath:gsub("%.luau?$", "") .. ".html"
end

if not fs.isFile(inputPath) then
	print(`Error: file not found: {inputPath}`)
	process.exit(1)
end

-- Require the page script — it must return a Page object
local page = require(inputPath)

if type(page) ~= "table" or type(page.Render) ~= "function" then
	print("Error: your script must return a Page object (e.g. `return page` at the end)")
	process.exit(1)
end

local html = page:Render()
fs.writeFile(outputPath, html)

print(`✓ Rendered {inputPath} → {outputPath}`)
