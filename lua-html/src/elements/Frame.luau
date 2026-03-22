-- Frame → <div>
-- Works like a Roblox Frame: a container you put other things inside.
local Element = require("../Element")

local function Frame(props: any?): Element.Element
	local el = Element.new("div")
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

return Frame
