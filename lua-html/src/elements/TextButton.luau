-- TextButton → <button> or <a> if Href is set
-- Works like a Roblox TextButton: clickable, has a label.
local Element = require("../Element")

local function TextButton(props: any?): Element.Element
	local href = props and props.Href
	local tag  = href and "a" or "button"

	local el = Element.new(tag)
	el._text = props and props.Text or "Click"

	if href then
		el._attrs["href"] = href
	end

	-- Sensible button defaults so it looks good without extra styling
	el._styles["cursor"] = "pointer"
	el._styles["display"] = "inline-block"

	if props then
		for k, v in props do
			if k == "Parent" then
				table.insert(v._children, el)
			elseif k == "Text" then
				el._text = v
			elseif k == "Href" then
				-- already handled
			else
				(el :: any)[k] = v
			end
		end
	end

	return el
end

return TextButton
