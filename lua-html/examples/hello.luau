--[[
  Minimal hello world — the smallest possible page.
  Run with: lune run cli.luau examples/hello.luau
]]

local UI = require("../src/init")

local page = UI.Page.new()
page.Title = "Hello World"

UI.TextLabel {
	Parent       = page.Body,
	HeadingLevel = 1,
	Text         = "Hello, World!",
	TextColor    = UI.Color.fromRGB(30, 30, 30),
	TextSize     = 48,
}

UI.TextLabel {
	Parent    = page.Body,
	Text      = "This page was written in Luau, not HTML.",
	TextColor = UI.Color.fromRGB(100, 100, 100),
}

return page
