from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "icons"
CANVAS_SIZE = 1024
SCALE = CANVAS_SIZE / 128
OUTPUT_SIZES = (16, 24, 32, 48, 128)


def scaled_box(x, y, width, height):
    return tuple(round(value * SCALE) for value in (x, y, x + width, y + height))


def draw_rounded_rect(draw, x, y, width, height, radius, fill):
    draw.rounded_rectangle(
        scaled_box(x, y, width, height),
        radius=round(radius * SCALE),
        fill=fill,
    )


def main():
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    draw_rounded_rect(draw, 4, 4, 120, 120, 24, "#0f766e")
    draw_rounded_rect(draw, 24, 29, 80, 10, 5, "#ffffff")
    draw_rounded_rect(draw, 24, 59, 31, 10, 5, "#ffffff")
    draw_rounded_rect(draw, 77, 59, 27, 10, 5, "#ffffff")
    draw_rounded_rect(draw, 61, 50, 7, 28, 3.5, "#fde68a")
    draw_rounded_rect(draw, 24, 89, 64, 10, 5, "#ffffff")

    for size in OUTPUT_SIZES:
        output = image.resize((size, size), Image.Resampling.LANCZOS)
        output.save(ICON_DIR / f"icon-{size}.png", optimize=True)


if __name__ == "__main__":
    main()
