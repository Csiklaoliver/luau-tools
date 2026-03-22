local Color = require("./Color")

export type Element = {
	_tag: string,
	_children: { Element },
	_styles: { [string]: string },
	_attrs: { [string]: string },
	_text: string?,
	_selfClosing: boolean,

	-- Common properties (set like Roblox Studio properties)
	Parent: Element?,
	BackgroundColor: Color.Color?,
	BackgroundTransparency: number?,
	TextColor: Color.Color?,
	Text: string?,
	TextSize: number?,
	FontWeight: string?,
	Size: { width: string, height: string }?,
	MaxWidth: string?,
	Padding: number | { top: number?, right: number?, bottom: number?, left: number? }?,
	Margin: number | { top: number?, right: number?, bottom: number?, left: number? }?,
	BorderRadius: number?,
	BorderColor: Color.Color?,
	BorderWidth: number?,
	Visible: boolean?,
	ZIndex: number?,
	Overflow: string?,
	-- Flexbox layout (like UIListLayout)
	Layout: string?,    -- "row" | "column"
	Gap: number?,
	AlignItems: string?, -- "center" | "flex-start" | "flex-end"
	JustifyContent: string?,

	AddClass: (self: Element, class: string) -> (),
	SetAttr: (self: Element, key: string, value: string) -> (),
	SetStyle: (self: Element, key: string, value: string) -> (),
}

local Element = {}
Element.__index = Element

local function toPx(value: number | string): string
	if type(value) == "number" then
		return value .. "px"
	end
	return value :: string
end

local function paddingCSS(v: number | { top: number?, right: number?, bottom: number?, left: number? }): string
	if type(v) == "number" then
		return v .. "px"
	end
	local t = v.top    or 0
	local r = v.right  or 0
	local b = v.bottom or 0
	local l = v.left   or 0
	return string.format("%dpx %dpx %dpx %dpx", t, r, b, l)
end

function Element.new(tag: string, selfClosing: boolean?): Element
	local self = setmetatable({}, Element) :: any
	self._tag         = tag
	self._children    = {}
	self._styles      = {}
	self._attrs       = {}
	self._text        = nil
	self._selfClosing = selfClosing == true
	return self
end

function Element:AddClass(class: string)
	local existing = self._attrs["class"] or ""
	if existing == "" then
		self._attrs["class"] = class
	else
		self._attrs["class"] = existing .. " " .. class
	end
end

function Element:SetAttr(key: string, value: string)
	self._attrs[key] = value
end

function Element:SetStyle(key: string, value: string)
	self._styles[key] = value
end

-- Build CSS string from all properties before rendering
function Element:_buildStyles()
	local s = self._styles

	if self.BackgroundColor then
		local alpha = self.BackgroundTransparency and (1 - self.BackgroundTransparency) or self.BackgroundColor.a
		s["background-color"] = Color.toCSS(Color.withAlpha(self.BackgroundColor, alpha))
	elseif self.BackgroundTransparency == 1 then
		s["background"] = "transparent"
	end

	if self.TextColor then
		s["color"] = Color.toCSS(self.TextColor)
	end

	if self.TextSize then
		s["font-size"] = self.TextSize .. "px"
	end

	if self.FontWeight then
		s["font-weight"] = self.FontWeight
	end

	if self.Size then
		if self.Size.width  then s["width"]  = toPx(self.Size.width)  end
		if self.Size.height then s["height"] = toPx(self.Size.height) end
	end

	if self.MaxWidth then
		s["max-width"] = toPx(self.MaxWidth)
	end

	if self.Padding ~= nil then
		s["padding"] = paddingCSS(self.Padding)
	end

	if self.Margin ~= nil then
		s["margin"] = paddingCSS(self.Margin)
	end

	if self.BorderRadius then
		s["border-radius"] = self.BorderRadius .. "px"
	end

	if self.BorderColor then
		local bw = self.BorderWidth or 1
		s["border"] = string.format("%dpx solid %s", bw, Color.toCSS(self.BorderColor))
	end

	if self.Visible == false then
		s["display"] = "none"
	end

	if self.ZIndex then
		s["z-index"] = tostring(self.ZIndex)
		s["position"] = s["position"] or "relative"
	end

	if self.Overflow then
		s["overflow"] = self.Overflow
	end

	if self.Layout then
		s["display"] = "flex"
		s["flex-direction"] = self.Layout
	end

	if self.Gap then
		s["gap"] = self.Gap .. "px"
	end

	if self.AlignItems then
		s["align-items"] = self.AlignItems
	end

	if self.JustifyContent then
		s["justify-content"] = self.JustifyContent
	end
end

function Element:_styleAttr(): string
	self:_buildStyles()
	local parts = {}
	for k, v in self._styles do
		table.insert(parts, k .. ":" .. v)
	end
	if #parts == 0 then return "" end
	table.sort(parts)
	return ' style="' .. table.concat(parts, ";") .. '"'
end

function Element:_attrsStr(): string
	local parts = {}
	for k, v in self._attrs do
		table.insert(parts, k .. '="' .. v .. '"')
	end
	table.sort(parts)
	return #parts > 0 and (" " .. table.concat(parts, " ")) or ""
end

return Element
