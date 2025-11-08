# PlayfulChess

This repository contains a small, playful chess demo with two parts:

- Web UI (static): `web/` and `docs/` contain the same static site. The `docs/` folder is prepared so you can host the web UI via GitHub Pages.
- Console game (Python): `PlayfulChess.py` — a simple local 2-player console game.

How to run locally

1) Web UI (quick):
   - Start a static server from the project root and open the site:

```powershell
python -m http.server 8000 --directory "d:\Chess\docs"
# then open http://localhost:8000/
```

2) Console game (Python):

```powershell
python "d:\Chess\PlayfulChess.py"
```

Publish to GitHub and enable Pages

1. Create a new repository on GitHub (via the web UI). Do NOT initialize with a README (you already have one).
2. In your local project folder (`d:\Chess`), run:

```powershell
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

3. In the GitHub repo settings, go to Pages and set the source to the `main` branch and the `/docs` folder. Save — the site will be available at `https://<your-username>.github.io/<repo-name>/` shortly.

Notes

- The Python game is a console application; your friend can clone the repo and run `python PlayfulChess.py` to play locally.
- If you prefer the web UI as the main site, enabling Pages from `docs/` is easiest and requires no build tools.
