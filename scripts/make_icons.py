from PIL import Image, ImageDraw, ImageFont

SIZE = 512
TOP_COLOR = (43, 47, 58)
BOTTOM_COLOR = (26, 28, 34)
BORDER_COLOR = (207, 160, 76)
TEXT_COLOR = (247, 231, 200)
RADIUS = 96
BORDER_WIDTH = 16

def make_base():
    img = Image.new("RGB", (SIZE, SIZE), TOP_COLOR)
    px = img.load()
    for y in range(SIZE):
        t = y / (SIZE - 1)
        r = round(TOP_COLOR[0] + (BOTTOM_COLOR[0] - TOP_COLOR[0]) * t)
        g = round(TOP_COLOR[1] + (BOTTOM_COLOR[1] - TOP_COLOR[1]) * t)
        b = round(TOP_COLOR[2] + (BOTTOM_COLOR[2] - TOP_COLOR[2]) * t)
        for x in range(SIZE):
            px[x, y] = (r, g, b)

    mask = Image.new("L", (SIZE, SIZE), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=RADIUS, fill=255)

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(img, (0, 0), mask)

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(
        [BORDER_WIDTH / 2, BORDER_WIDTH / 2, SIZE - 1 - BORDER_WIDTH / 2, SIZE - 1 - BORDER_WIDTH / 2],
        radius=RADIUS - BORDER_WIDTH / 2,
        outline=BORDER_COLOR,
        width=BORDER_WIDTH,
    )

    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 300)
    text = "?"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(
        ((SIZE - tw) / 2 - bbox[0], (SIZE - th) / 2 - bbox[1]),
        text,
        font=font,
        fill=TEXT_COLOR,
    )

    return canvas

base = make_base()
base.save("icon-512.png")
base.resize((192, 192), Image.LANCZOS).save("icon-192.png")

# Maskable variant with extra safe-zone padding (icon content within inner ~80%)
maskable = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
mdraw = ImageDraw.Draw(maskable)
mdraw.rectangle([0, 0, SIZE, SIZE], fill=BOTTOM_COLOR)
inner = base.resize((int(SIZE * 0.7), int(SIZE * 0.7)), Image.LANCZOS)
maskable.paste(inner, ((SIZE - inner.width) // 2, (SIZE - inner.height) // 2), inner)
maskable.convert("RGB").save("icon-maskable-512.png")

print("done")
