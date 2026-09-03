# Sörfeszt

Sörfesztivál landing a [sorfeszt.hu](https://sorfeszt.hu) krémszínű / tengerészkék / arany világával. tBook-kompatibilis: jegytípus + nap választás a `/jegyek` és `/foglalas` oldalakon.

- **Főoldal** — hero, helyszín, sörkártyás jegyek (tartalomlistával), sörök (hamarosan), színezett programtáblák, nyitvatartás, galéria, kapcsolat
- **Jegyek** — tBook események sörkártyaként; a leírás mező sorai = mi jár a jeggyel
- **Házirend** — `/hazirend`

## tBook beállítás (te hozod létre)

Minden **jegytípus × nap** legyen külön esemény, például:

- `Napijegy earlybird — Péntek`
- `Napijegy earlybird — Szombat`
- `VIP Napijegy earlybird — Vasárnap`

Így a vendég a kártyán választ jegyet **és** napot. A leírásba soronként írd a tartalmat:

```
Belépés
3 db kóstolójegy
```

A tBook API kulcsot a CMS főoldalon (`chrome.tbookApiKey`) kell megadni, majd közzétenni.
