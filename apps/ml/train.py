import argparse, os, time
from pathlib import Path

import torch, torch.nn as nn
from torch.utils.data import DataLoader
from torchvision.datasets import ImageFolder
import timm

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="./data", help="folder with train/ and val/")
    p.add_argument("--out", default="./models/deepfake.pt")
    p.add_argument("--backbone", default="efficientnet_b0")
    p.add_argument("--image-size", type=int, default=224)
    p.add_argument("--epochs", type=int, default=3)
    p.add_argument("--bs", type=int, default=32)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--freeze", action="store_true", help="freeze backbone, train head only")
    return p.parse_args()

def make_loader(root, split, img_size, bs, train):
    tfm = timm.data.create_transform(
        **timm.data.resolve_model_data_config({"img_size": img_size}),
        is_training=train,
    )
    ds = ImageFolder(os.path.join(root, split), transform=tfm)
    # enforce class mapping: real->0, fake->1
    assert set(ds.class_to_idx.keys()) == {"real","fake"}, f"expected real/fake, got {ds.class_to_idx}"
    return DataLoader(ds, batch_size=bs, shuffle=train, num_workers=4, pin_memory=True)

def main():
    args = parse_args()
    device = "cuda" if torch.cuda.is_available() else "cpu"

    train_loader = make_loader(args.data, "train", args.image_size, args.bs, True)
    val_loader   = make_loader(args.data, "val",   args.image_size, args.bs, False)

    model = timm.create_model(args.backbone, pretrained=True, num_classes=1)
    if args.freeze:
        for n,p in model.named_parameters():
            if "classifier" not in n and "fc" not in n:
                p.requires_grad_(False)
    model.to(device)

    opt = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr)
    loss_fn = nn.BCEWithLogitsLoss()

    best_acc = 0.0
    out_path = Path(args.out); out_path.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        model.train()
        t0 = time.time()
        total, correct, loss_sum = 0, 0, 0.0
        for x, y in train_loader:
            # y: 0=real, 1=fake
            x = x.to(device)
            y = y.float().unsqueeze(1).to(device)
            logits = model(x)
            loss = loss_fn(logits, y)
            opt.zero_grad()
            loss.backward()
            opt.step()

            with torch.no_grad():
                pred = (torch.sigmoid(logits) > 0.5).long().squeeze(1)
                correct += (pred == y.long().squeeze(1)).sum().item()
                total += y.size(0)
                loss_sum += loss.item() * y.size(0)

        train_acc = correct / max(1,total)
        train_loss = loss_sum / max(1,total)

        # ---- validation
        model.eval()
        v_total, v_correct, v_loss_sum = 0, 0, 0.0
        with torch.no_grad():
            for x, y in val_loader:
                x = x.to(device)
                y = y.float().unsqueeze(1).to(device)
                logits = model(x)
                loss = loss_fn(logits, y)
                pred = (torch.sigmoid(logits) > 0.5).long().squeeze(1)
                v_correct += (pred == y.long().squeeze(1)).sum().item()
                v_total += y.size(0)
                v_loss_sum += loss.item() * y.size(0)

        val_acc = v_correct / max(1,v_total)
        val_loss = v_loss_sum / max(1,v_total)
        dt = time.time() - t0
        print(f"[{epoch}/{args.epochs}] train_loss={train_loss:.4f} acc={train_acc:.3f} "
              f"| val_loss={val_loss:.4f} acc={val_acc:.3f} ({dt:.1f}s)")

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), out_path)
            print(f"  saved weights -> {out_path} (val_acc={best_acc:.3f})")

if __name__ == "__main__":
    main()
