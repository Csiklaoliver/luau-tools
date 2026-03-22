-- Divider → <hr>
-- Like a UIStroke used as a separator.
local Element = require("../Element")

local function Divider(props: any?): Element.Element
	local el = Element.new("hr", true)
	el._styles["border"] = "none"
	el._styles["border-top"] = "1px solid #e0e0e0"
	el._styles["margin"] = "16px 0"

	if props then
		for k, v in props do
			if k == "Parent" then
				table.insert(v._children, el)
			else
				(el :: any)[k] = v
			end
		end
	end

	return el
end

return Divider
