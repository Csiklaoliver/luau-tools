-- ImageLabel → <img>
-- Set Src and Alt exactly like Roblox's Image/ImageLabel properties.
local Element = require("../Element")

local function ImageLabel(props: any?): Element.Element
	local el = Element.new("img", true) -- self-closing
	el._attrs["src"] = (props and props.Src) or ""
	el._attrs["alt"] = (props and props.Alt) or ""

	-- Default: image fills its container width like Roblox ImageLabel
	el._styles["max-width"] = "100%"
	el._styles["display"]   = "block"

	if props then
		for k, v in props do
			if k == "Parent" then
				table.insert(v._children, el)
			elseif k == "Src" then
				el._attrs["src"] = v
			elseif k == "Alt" then
				el._attrs["alt"] = v
			else
				(el :: any)[k] = v
			end
		end
	end

	return el
end

return ImageLabel
