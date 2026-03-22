# lua-html

**Design web pages in Luau — the same way you build UIs in Roblox Studio.**

Struggling to learn HTML? Too many tags, closing brackets, and attribute strings to remember? If you already know how to place a `Frame` or `TextLabel` in Roblox Studio, you already know how to use this.

---

## The idea

In Roblox Studio you write UI like this:

```lua
local frame = Instance.new("Frame")
frame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
frame.Size = UDim2.new(0, 400, 0, 200)
frame.Parent = screenGui
```

With lua-html you write web pages the same way:

```lua
local UI = require("./src")

local page = UI.Page.new()
page.Title = "My Page"

local frame = UI.Frame {
    BackgroundColor = UI.Color.fromRGB(30, 30, 30),
    Size            = UI.Size("400px", "200px"),
    Padding         = UI.Padding(24),
    Parent          = page.Body,
}

UI.TextLabel {
    Text      = "Hello, World!",
    TextColor = UI.Color.White,
    TextSize  = 32,
    Parent    = frame,
}

print(page:Render()) -- outputs clean HTML
```

That's it. No `<div>`, no `</div>`, no `style="font-size:32px"`. Just properties.

---

## Install

You need [Lune](https://github.com/lune-org/lune) to run `.luau` files outside Roblox:

```bash
cargo install lune
# or via aftman / rokit
```

Clone this repo and run an example:

```bash
lune run cli.luau examples/hello.luau
# → hello.html
```

---

## Elements

Every element is called like a function with a properties table — exactly like creating Roblox instances with default properties.

| lua-html | HTML output | Roblox equivalent |
|---|---|---|
| `UI.Frame {}` | `<div>` | `Frame` |
| `UI.TextLabel {}` | `<p>` / `<h1>`–`<h6>` | `TextLabel` |
| `UI.TextButton {}` | `<button>` / `<a>` | `TextButton` |
| `UI.ImageLabel {}` | `<img>` | `ImageLabel` |
| `UI.Divider {}` | `<hr>` | `UIStroke` separator |

---

## Properties

These work the same across all elements:

| Property | Type | CSS equivalent |
|---|---|---|
| `Parent` | element or `page.Body` | (tree structure) |
| `BackgroundColor` | `Color` | `background-color` |
| `BackgroundTransparency` | `0`–`1` | `opacity` on background |
| `TextColor` | `Color` | `color` |
| `TextSize` | `number` (px) | `font-size` |
| `FontWeight` | `"400"` / `"700"` etc. | `font-weight` |
| `Size` | `UI.Size(w, h)` | `width` + `height` |
| `MaxWidth` | `string` e.g. `"600px"` | `max-width` |
| `Padding` | `UI.Padding(n)` or `UI.PaddingXY(x, y)` | `padding` |
| `Margin` | same as Padding | `margin` |
| `BorderRadius` | `number` (px) | `border-radius` |
| `BorderColor` | `Color` | `border` |
| `BorderWidth` | `number` (px) | `border` width |
| `Visible` | `boolean` | `display:none` |
| `ZIndex` | `number` | `z-index` |
| `Layout` | `"row"` / `"column"` | `display:flex` + `flex-direction` |
| `Gap` | `number` (px) | `gap` |
| `AlignItems` | `"center"` etc. | `align-items` |
| `JustifyContent` | `"center"` etc. | `justify-content` |

**Element-specific:**

| Element | Extra properties |
|---|---|
| `TextLabel` | `Text`, `HeadingLevel` (1–6 for `<h1>`–`<h6>`) |
| `TextButton` | `Text`, `Href` (turns it into an `<a>` link) |
| `ImageLabel` | `Src` (image URL), `Alt` (alt text) |

---

## Color

```lua
local Color = UI.Color

Color.fromRGB(255, 100, 50)     -- like Color3.fromRGB
Color.fromHex("#ff6432")        -- hex shorthand
Color.withAlpha(color, 0.5)     -- 50% transparent
Color.White / Color.Black / Color.Red / Color.Blue / ...
```

---

## Page setup

```lua
local page = UI.Page.new()
page.Title       = "My Page"
page.Description = "Page description for search engines"

page:AddStylesheet("styles.css")  -- link an external CSS file

local html = page:Render()        -- returns the full HTML string
```

---

## CLI

```bash
# Output inferred from input filename
lune run cli.luau examples/landing.luau
# → examples/landing.html

# Explicit output path
lune run cli.luau examples/landing.luau dist/index.html
```

Your `.luau` file just needs to return the page at the end:

```lua
-- my-page.luau
local UI = require("./src")
local page = UI.Page.new()
-- ... build your page ...
return page  -- ← required
```

---

## Example

```lua
local UI = require("./src")

local page = UI.Page.new()
page.Title = "Welcome"

-- Dark hero section
local hero = UI.Frame {
    Parent          = page.Body,
    BackgroundColor = UI.Color.fromHex("#0f172a"),
    Padding         = UI.PaddingXY(32, 80),
    Layout          = "column",
    AlignItems      = "center",
    Gap             = 24,
}

UI.TextLabel {
    Parent       = hero,
    HeadingLevel = 1,
    Text         = "Hello from Lua!",
    TextColor    = UI.Color.White,
    TextSize     = 48,
    FontWeight   = "700",
}

UI.TextButton {
    Parent          = hero,
    Text            = "Learn more",
    Href            = "#",
    BackgroundColor = UI.Color.fromHex("#6366f1"),
    TextColor       = UI.Color.White,
    Padding         = UI.PaddingXY(24, 12),
    BorderRadius    = 8,
}

return page
```

Run it:
```bash
lune run cli.luau my-page.luau
```

Output:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body>
  <div style="align-items:center;background-color:rgb(15,23,42);display:flex;flex-direction:column;gap:24px;padding:80px 32px 80px 32px">
    <h1 style="color:rgb(255,255,255);font-size:48px;font-weight:700">Hello from Lua!</h1>
    <a href="#" style="...">Learn more</a>
  </div>
</body>
</html>
```

---

## License

MIT
