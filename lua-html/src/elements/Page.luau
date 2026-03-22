local Element = require("../Element")
local Renderer = require("../Renderer")

export type Page = {
	_title: string,
	_description: string,
	_charset: string,
	_cssLinks: { string },
	_body: Element.Element,

	Title: string,
	Description: string,

	AddStylesheet: (self: Page, href: string) -> (),
	Render: (self: Page) -> string,
}

local Page = {}
Page.__index = Page

function Page.new(): Page
	local self = setmetatable({}, Page) :: any
	self._title       = "Page"
	self._description = ""
	self._charset     = "UTF-8"
	self._cssLinks    = {}
	self._body        = Element.new("body")
	return self
end

function Page:AddStylesheet(href: string)
	table.insert(self._cssLinks, href)
end

function Page:Render(): string
	return Renderer.renderPage(self)
end

function Page:__newindex(key: string, value: any)
	if key == "Title" then
		self._title = value
	elseif key == "Description" then
		self._description = value
	else
		rawset(self, key, value)
	end
end

-- Proxy: page.Body returns the body element so children can be parented to it
function Page:__index(key: string): any
	if key == "Body" then
		return self._body
	end
	return Page[key]
end

return Page
