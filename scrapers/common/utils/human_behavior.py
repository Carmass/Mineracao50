"""Human behavior simulation for anti-bot evasion."""
import asyncio
import random
import math
from playwright.async_api import Page


async def human_delay(min_ms: int = 800, max_ms: int = 2500):
    """Wait a random human-like delay."""
    delay = random.randint(min_ms, max_ms)
    # Add slight randomness with gaussian distribution
    delay = max(100, int(random.gauss(delay, delay * 0.1)))
    await asyncio.sleep(delay / 1000)


async def human_scroll(page: Page, target_y: int = 0):
    """Scroll page in a human-like way."""
    current_y = await page.evaluate("window.scrollY")
    distance = target_y - current_y
    steps = random.randint(8, 20)

    for i in range(steps):
        progress = (i + 1) / steps
        # Ease in-out
        eased = progress * progress * (3 - 2 * progress)
        new_y = current_y + int(distance * eased)
        await page.evaluate(f"window.scrollTo(0, {new_y})")
        await asyncio.sleep(random.uniform(0.02, 0.08))


async def human_mouse_move(page: Page, x: int, y: int):
    """Move mouse in a bezier curve path."""
    current = await page.evaluate("({x: window.mouseX || 0, y: window.mouseY || 0})")
    steps = random.randint(20, 40)

    # Bezier control points
    cp1_x = current["x"] + random.randint(-100, 100)
    cp1_y = current["y"] + random.randint(-100, 100)
    cp2_x = x + random.randint(-50, 50)
    cp2_y = y + random.randint(-50, 50)

    for i in range(steps):
        t = i / steps
        bx = (1-t)**3 * current["x"] + 3*(1-t)**2*t*cp1_x + 3*(1-t)*t**2*cp2_x + t**3*x
        by = (1-t)**3 * current["y"] + 3*(1-t)**2*t*cp1_y + 3*(1-t)*t**2*cp2_y + t**3*y
        await page.mouse.move(bx, by)
        await asyncio.sleep(random.uniform(0.005, 0.02))


async def human_click(page: Page, selector: str):
    """Click an element in a human-like way."""
    element = await page.wait_for_selector(selector, timeout=5000)
    if not element:
        return

    box = await element.bounding_box()
    if not box:
        return

    # Click slightly off-center for realism
    target_x = box["x"] + box["width"] * random.uniform(0.3, 0.7)
    target_y = box["y"] + box["height"] * random.uniform(0.3, 0.7)

    await human_mouse_move(page, int(target_x), int(target_y))
    await human_delay(100, 300)
    await page.mouse.click(target_x, target_y)


async def human_type(page: Page, selector: str, text: str):
    """Type text in a human-like way with realistic delays."""
    await human_click(page, selector)
    await human_delay(200, 500)

    for char in text:
        delay = random.gauss(120, 40)  # avg 120ms per key
        delay = max(50, min(400, delay))
        await page.keyboard.type(char, delay=delay)

    await human_delay(300, 800)


async def random_viewport_scroll(page: Page):
    """Randomly scroll to simulate reading behavior."""
    total_height = await page.evaluate("document.body.scrollHeight")
    viewport_height = await page.evaluate("window.innerHeight")

    scroll_positions = [
        random.randint(0, total_height // 3),
        random.randint(total_height // 3, total_height // 2),
        random.randint(total_height // 2, total_height - viewport_height),
    ]

    for pos in scroll_positions:
        await human_scroll(page, pos)
        await human_delay(500, 1500)
