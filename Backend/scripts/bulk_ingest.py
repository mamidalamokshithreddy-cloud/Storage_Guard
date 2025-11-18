import asyncio
import argparse
from pathlib import Path
from typing import List
from PIL import Image
from app.models.vision_classifier import get_classifier
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bulk_ingest")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

def collect_images(root: Path) -> List[tuple]:
    items = []
    for class_dir in root.iterdir():
        if not class_dir.is_dir():
            continue
        label = class_dir.name
        for img_path in class_dir.rglob('*'):
            if img_path.suffix.lower() in IMAGE_EXTS:
                items.append((img_path, label))
    return items

async def ingest(root: Path, trigger_every: int = 50, dry_run: bool = False):
    classifier = get_classifier()
    pairs = collect_images(root)
    logger.info(f"Discovered {len(pairs)} images under {root}")
    added = 0
    for idx, (img_path, label) in enumerate(pairs, start=1):
        try:
            if dry_run:
                continue
            with Image.open(img_path).convert('RGB') as img:
                await classifier.add_training_sample(img, label=label, user_provided=True)
            added += 1
            if added % trigger_every == 0:
                await classifier.trigger_training()
        except Exception as e:
            logger.error(f"Failed ingesting {img_path}: {e}")
    if not dry_run:
        await classifier.trigger_training()
    logger.info(f"Ingestion complete. Added={added} classes={len(classifier.class_names)} queue_size={len(classifier.training_queue)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk ingest labeled images into training queue. Directory structure: root/class_name/image.jpg")
    parser.add_argument('--root', required=True, help='Root folder containing class subfolders')
    parser.add_argument('--trigger-every', type=int, default=50, help='Trigger training after this many new samples')
    parser.add_argument('--dry-run', action='store_true', help='Scan only, do not ingest')
    args = parser.parse_args()
    asyncio.run(ingest(Path(args.root), trigger_every=args.trigger_every, dry_run=args.dry_run))
