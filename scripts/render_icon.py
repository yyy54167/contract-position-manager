"""Render the vector rocket mark as high-resolution PNG app icons."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
scale = 2
canvas = 512 * scale


def p(x, y):
    return round(x * scale), round(y * scale)


def curve(a, b, c, d, steps=32):
    result = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        result.append(p(
            u**3*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t**3*d[0],
            u**3*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t**3*d[1],
        ))
    return result


def shape(draw, segments, fill):
    points = []
    for segment in segments:
        points.extend(curve(*segment) if len(segment) == 4 else [p(*segment)])
    draw.polygon(points, fill=fill)


rocket = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0))
d = ImageDraw.Draw(rocket)
d.line((p(222, 366), p(222, 403)), fill=(85, 207, 196, 165), width=10*scale)
d.line((p(290, 366), p(290, 393)), fill=(85, 207, 196, 165), width=10*scale)
for x, y in ((222, 366), (222, 403), (290, 366), (290, 393)):
    d.ellipse((p(x-5, y-5), p(x+5, y+5)), fill=(85, 207, 196, 165))

shape(d, [
    (236, 328), ((236, 328), (226, 350), (230, 371), (241, 390)),
    (256, 414), (271, 390), ((271, 390), (282, 371), (286, 350), (276, 328)),
], '#ff9d61')
shape(d, [
    (248, 345), ((248, 345), (244, 359), (248, 375), (256, 388)),
    ((256, 388), (264, 375), (268, 359), (264, 345)),
], '#ffdc91')

shape(d, [
    (216, 257), ((216, 257), (188, 275), (173, 302), (171, 340)),
    (221, 318),
], '#56d0c5')
shape(d, [
    (296, 257), ((296, 257), (324, 275), (339, 302), (341, 340)),
    (291, 318),
], '#56d0c5')

shape(d, [
    (256, 108), ((256, 108), (225, 135), (208, 177), (208, 233)),
    (208, 304), ((208, 304), (221, 321), (237, 333), (256, 341)),
    ((256, 341), (275, 333), (291, 321), (304, 304)),
    (304, 233), ((304, 233), (304, 177), (287, 135), (256, 108)),
], '#f5f9fb')
shape(d, [
    (256, 108), ((256, 108), (240, 122), (228, 139), (220, 160)),
    ((220, 160), (244, 151), (268, 151), (292, 160)),
    ((292, 160), (284, 139), (272, 122), (256, 108)),
], '#d6edf3')
d.ellipse((p(224, 188), p(288, 252)), fill='#163f5c')
d.ellipse((p(234, 198), p(278, 242)), fill='#65d5d4')
shape(d, [
    (222, 315), ((222, 315), (232, 324), (243, 331), (256, 336)),
    ((256, 336), (269, 331), (280, 324), (290, 315)),
    (279, 349), (233, 349),
], '#d6edf3')

background = Image.new('RGBA', (canvas, canvas), '#10283f')
tilted = rocket.rotate(-45, resample=Image.Resampling.BICUBIC)
scaled_size = round(canvas * 1.35)
tilted = tilted.resize((scaled_size, scaled_size), Image.Resampling.LANCZOS)
crop = (scaled_size - canvas) // 2
background.alpha_composite(tilted.crop((crop, crop, crop + canvas, crop + canvas)))
for size in (192, 512):
    background.resize((size, size), Image.Resampling.LANCZOS).convert('RGB').save(root / f'icon-{size}.png', optimize=True)
