--[[
  lua-html
  Design web pages in Luau — same mental model as Roblox Studio UI.

  Usage:
    local UI = require("./src")
    local page = UI.Page.new()
    page.Title = "Hello World"

    UI.TextLabel {
      Text = "Hello!",
      HeadingLevel = 1,
      Parent = page.Body,
    }

    print(page:Render())
]]

local Color      = require("./Color")
local Page       = require("./elements/Page")
local Frame      = require("./elements/Frame")
local TextLabel  = require("./elements/TextLabel")
local TextButton = require("./elements/TextButton")
local ImageLabel = require("./elements/ImageLabel")
local Divider    = require("./elements/Divider")

-- Size helper — mirrors UDim2 just enough to feel familiar
local function Size(width: number | string, height: number | string)
	return { width = width, height = height }
end

-- Padding helper — mirrors UDim or a simple number
local function Padding(all: number): { top: number, right: number, bottom: number, left: number }
	return { top = all, right = all, bottom = all, left = all }
end

local function PaddingXY(x: number, y: number)
	return { top = y, right = x, bottom = y, left = x }
end

return {
	-- Core
	Color       = Color,
	Page        = Page,

	-- Elements (call like functions with a props table)
	Frame       = Frame,
	TextLabel   = TextLabel,
	TextButton  = TextButton,
	ImageLabel  = ImageLabel,
	Divider     = Divider,

	-- Helpers
	Size        = Size,
	Padding     = Padding,
	PaddingXY   = PaddingXY,
}
