# 🚀 COMMENCE ICI !

## 3 étapes ultra simples pour tester ton API

### 1️⃣ Installe k6 (1 minute)

```bash
brew install k6
```

### 2️⃣ Démarre ton API (dans un autre terminal)

```bash
npm run start:dev api
```

### 3️⃣ Lance ton premier test (30 secondes)

```bash
npm run perf:test
```

---

## ✅ Si tout va bien, tu verras :

```
✓ status is 200
✓ response time < 500ms

http_req_duration..............: avg=167ms
http_req_failed................: 0.00%
```

**Ça veut dire** :

- ✅ Ton API répond en 167ms en moyenne → **RAPIDE !**
- ✅ Aucune erreur → **PARFAIT !**

---

## 🎓 Pour en savoir plus

| Tu veux...                        | Lis ce fichier                                   |
| --------------------------------- | ------------------------------------------------ |
| 👶 Comprendre ce que c'est        | [GUIDE_SIMPLE.md](GUIDE_SIMPLE.md)               |
| 🚀 Lancer plus de tests           | [QUICKSTART.md](QUICKSTART.md)                   |
| 📊 Voir des exemples de résultats | [EXAMPLES.md](EXAMPLES.md)                       |
| 🔬 Tout comprendre en détail      | [PERFORMANCE_TESTING.md](PERFORMANCE_TESTING.md) |
| 📑 Vue d'ensemble complète        | [INDEX.md](INDEX.md)                             |

---

## 💡 Les autres tests disponibles

```bash
npm run perf:spike      # Test avec un pic soudain d'utilisateurs
npm run perf:stress     # Test pour trouver les limites
npm run perf:auth       # Test du système d'authentification
npm run perf:cryptos    # Test des endpoints cryptos
```

---

## 🆘 Problème ?

**Erreur "connection refused"**  
→ Ton API n'est pas démarrée. Lance `npm run start:dev api`

**Erreur "k6 command not found"**  
→ k6 n'est pas installé. Lance `brew install k6`

**Les tests sont lents**  
→ Normal sur un petit PC. Compare tes résultats entre eux.

**J'ai beaucoup d'erreurs**  
→ Vérifie que l'URL est bien `http://localhost:3001` dans les fichiers

---

**C'est tout ! Tu peux maintenant tester ton API ! 🎉**

---

**📖 Prochaine étape** : Lis [GUIDE_SIMPLE.md](GUIDE_SIMPLE.md) pour tout comprendre !
