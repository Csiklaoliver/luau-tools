--[[
  Example: a simple landing page
  Run with:  lune run cli.luau examples/landing.luau
  Output:    examples/landing.html
]]

-- UI is injected automatically by the CLI — no require needed
local Color = UI.Color

-- ── Page setup ──────────────────────────────────────────────────────────────
local page = UI.Page.new()
page.Title       = "My First Page"
page.Description = "Built with lua-html — no HTML required."

-- ── Hero section ─────────────────────────────────────────────────────────────
local hero = UI.Frame {
	Parent          = page.Body,
	BackgroundColor = Color.fromHex("#0f172a"),
	Padding         = UI.PaddingXY(32, 80),
	Layout          = "column",
	AlignItems      = "center",
	Gap             = 24,
}

UI.TextLabel {
	Parent       = hero,
	HeadingLevel = 1,
	Text         = "Stop writing HTML. Just use Lua.",
	TextColor    = Color.White,
	TextSize     = 48,
	FontWeight   = "700",
}

UI.TextLabel {
	Parent    = hero,
	Text      = "Design pages the same way you build UIs in Roblox Studio. No tags, no closing brackets, no headaches.",
	TextColor = Color.fromRGB(148, 163, 184),
	TextSize  = 18,
	MaxWidth  = "600px",
}

UI.TextButton {
	Parent          = hero,
	Text            = "Get Started",
	Href            = "#features",
	BackgroundColor = Color.fromHex("#6366f1"),
	TextColor       = Color.White,
	TextSize        = 16,
	FontWeight      = "600",
	Padding         = UI.PaddingXY(28, 14),
	BorderRadius    = 8,
}

-- ── Features section ─────────────────────────────────────────────────────────
local features = UI.Frame {
	Parent          = page.Body,
	BackgroundColor = Color.fromHex("#f8fafc"),
	Padding         = UI.PaddingXY(32, 64),
	Layout          = "column",
	AlignItems      = "center",
	Gap             = 48,
}

UI.TextLabel {
	Parent       = features,
	HeadingLevel = 2,
	Text         = "Why lua-html?",
	TextColor    = Color.fromHex("#0f172a"),
	TextSize     = 32,
	FontWeight   = "700",
}

local cards = UI.Frame {
	Parent   = features,
	Layout   = "row",
	Gap      = 24,
	MaxWidth = "900px",
}

local function Card(icon: string, title: string, body: string)
	local card = UI.Frame {
		Parent          = cards,
		BackgroundColor = Color.White,
		Padding         = UI.Padding(24),
		BorderRadius    = 12,
		BorderColor     = Color.fromHex("#e2e8f0"),
		BorderWidth     = 1,
		Layout          = "column",
		Gap             = 12,
	}
	UI.TextLabel { Parent = card, Text = icon,  TextSize = 32 }
	UI.TextLabel { Parent = card, HeadingLevel = 3, Text = title, TextColor = Color.fromHex("#1e293b"), TextSize = 18, FontWeight = "600" }
	UI.TextLabel { Parent = card, Text = body,  TextColor = Color.fromHex("#64748b"), TextSize = 15 }
end

Card("🎮", "Familiar syntax",   "If you've placed a Frame or TextLabel in Roblox Studio, you already know 80% of this.")
Card("⚡", "Zero HTML",         "No opening tags, closing tags, or attribute strings. Just Luau tables and properties.")
Card("🔒", "Type safe",         "Full Luau type checking — catch mistakes before the page renders.")

-- ── Footer ───────────────────────────────────────────────────────────────────
UI.Divider { Parent = page.Body }

local footer = UI.Frame {
	Parent          = page.Body,
	BackgroundColor = Color.fromHex("#0f172a"),
	Padding         = UI.PaddingXY(32, 24),
	Layout          = "row",
	JustifyContent  = "center",
}

UI.TextLabel {
	Parent    = footer,
	Text      = "Built with lua-html · MIT License",
	TextColor = Color.fromRGB(100, 116, 139),
	TextSize  = 13,
}

return page
