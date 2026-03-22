-- TextLabel → <p>, <h1>–<h6>, or <span>
-- Set HeadingLevel = 1..6 to get a heading tag instead of <p>.
local Element = require("../Element")

local function TextLabel(props: any?): Element.Element
	local level = props and props.HeadingLevel
	local tag = level and ("h" .. tostring(level)) or "p"

	local el = Element.new(tag)
	el._text = props and props.Text or ""

	if props then
		for k, v in props do
			if k == "Parent" then
				table.insert(v._children, el)
			elseif k == "Text" then
				el._text = v
			elseif k ~= "HeadingLevel" then
				(el :: any)[k] = v
			end
		end
	end

	return el
end

return TextLabel
