# 06 · GitHub'a Yayınlama

Repo yerelde hazırlandı (`git init` + ilk commit dahil). Remote'a push işlemi senin GitHub hesabınla yapılacağı için son adımı sen atacaksın.

## Yöntem A — GitHub CLI (en kolay)

```bash
cd signal-radar
gh auth login                      # bir kereye mahsus
gh repo create signal-radar --public --source=. --remote=origin --push
```

`--private` istersen `--public` yerine onu yaz.

## Yöntem B — Manuel

1. github.com → **New repository** → ad: `signal-radar` → README/`.gitignore` EKLEME (boş oluştur).
2. Terminalde:

```bash
cd signal-radar
git remote add origin https://github.com/KULLANICI_ADIN/signal-radar.git
git branch -M main
git push -u origin main
```

## Notlar

- `.gitignore` hazır: `node_modules/`, `dist/`, `.env*`, editör artıkları hariç tutuluyor.
- İlk commit "Faz 0: blueprint, gereksinimler, tasarım, indikatör matematiği ve Faz 1 promptu" olarak atıldı.
- Faz 1 kodu üretildikten sonra: `git add -A && git commit -m "Faz 1: canlı radar uygulaması" && git push`.
- Repo adını değiştirmek istersen: klasör adını ve yukarıdaki komutlardaki `signal-radar` kelimesini birlikte değiştir.
