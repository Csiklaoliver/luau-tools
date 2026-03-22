export type Color = {
	r: number,
	g: number,
	b: number,
	a: number,
}

local Color = {}

function Color.fromRGB(r: number, g: number, b: number): Color
	return { r = math.clamp(r, 0, 255), g = math.clamp(g, 0, 255), b = math.clamp(b, 0, 255), a = 1 }
end

function Color.fromHex(hex: string): Color
	hex = hex:gsub("^#", "")
	local r = tonumber(hex:sub(1, 2), 16) or 0
	local g = tonumber(hex:sub(3, 4), 16) or 0
	local b = tonumber(hex:sub(5, 6), 16) or 0
	return Color.fromRGB(r, g, b)
end

function Color.withAlpha(color: Color, alpha: number): Color
	return { r = color.r, g = color.g, b = color.b, a = math.clamp(alpha, 0, 1) }
end

function Color.toCSS(color: Color): string
	if color.a < 1 then
		return string.format("rgba(%d,%d,%d,%.2f)", color.r, color.g, color.b, color.a)
	end
	return string.format("rgb(%d,%d,%d)", color.r, color.g, color.b)
end

-- Preset colours — same names Roblox devs already know
Color.White      = Color.fromRGB(255, 255, 255)
Color.Black      = Color.fromRGB(0,   0,   0)
Color.Red        = Color.fromRGB(255, 0,   0)
Color.Green      = Color.fromRGB(0,   255, 0)
Color.Blue       = Color.fromRGB(0,   0,   255)
Color.Gray       = Color.fromRGB(128, 128, 128)
Color.DarkGray   = Color.fromRGB(40,  40,  40)
Color.Transparent = Color.withAlpha(Color.Black, 0)

return Color
