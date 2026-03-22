local Element = require("./Element")

local VOID_TAGS = {
	area = true, base = true, br = true, col = true, embed = true,
	hr = true, img = true, input = true, link = true, meta = true,
	param = true, source = true, track = true, wbr = true,
}

local function escapeHTML(s: string): string
	return (s
		:gsub("&",  "&amp;")
		:gsub("<",  "&lt;")
		:gsub(">",  "&gt;")
		:gsub('"',  "&quot;")
	)
end

local function renderElement(el: Element.Element, depth: number): string
	local indent = string.rep("  ", depth)
	local tag    = el._tag
	local attrs  = el:_attrsStr()
	local style  = el:_styleAttr()

	if VOID_TAGS[tag] or el._selfClosing then
		return indent .. "<" .. tag .. attrs .. style .. " />"
	end

	local open  = indent .. "<" .. tag .. attrs .. style .. ">"
	local close = "</" .. tag .. ">"

	-- Leaf node with text content
	if el._text and #el._children == 0 then
		return open .. escapeHTML(el._text) .. close
	end

	-- No children and no text
	if #el._children == 0 then
		return open .. close
	end

	-- Has children — expand over multiple lines
	local lines = { open }
	for _, child in el._children do
		table.insert(lines, renderElement(child, depth + 1))
	end
	table.insert(lines, indent .. close)

	return table.concat(lines, "\n")
end

local function renderPage(page: any): string
	local title = escapeHTML(page._title or "Page")
	local charset = page._charset or "UTF-8"
	local desc    = page._description or ""
	local cssLinks = ""
	for _, href in (page._cssLinks or {}) do
		cssLinks = cssLinks .. string.format('\n  <link rel="stylesheet" href="%s">', href)
	end

	local bodyChildren = {}
	for _, child in page._body._children do
		table.insert(bodyChildren, renderElement(child, 2))
	end

	local metaDesc = desc ~= "" and string.format('\n  <meta name="description" content="%s">', escapeHTML(desc)) or ""

	return table.concat({
		"<!DOCTYPE html>",
		"<html lang=\"en\">",
		"<head>",
		string.format('  <meta charset="%s">', charset),
		'  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
		metaDesc ~= "" and metaDesc or nil,
		string.format("  <title>%s</title>", title),
		cssLinks ~= "" and cssLinks or nil,
		"</head>",
		"<body>",
		table.concat(bodyChildren, "\n"),
		"</body>",
		"</html>",
	}, "\n")
end

return {
	renderPage    = renderPage,
	renderElement = renderElement,
}
