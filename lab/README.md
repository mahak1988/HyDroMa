# HyDroMA Controlled Laboratory (`lab/`)

Out-of-tree, controlled test environment for the scientific engine. **Outside**
`engines/` and never imported by it. Deterministic, offline, stdlib-only.

## Layout
```
lab/
  pilots/__init__.py   # 6 deterministic pilots (arid, semi_arid, humid, cold, mediterranean, saline)
  harness.py           # model battery + qualitative/cross-pilot checks
  run_lab.py           # CLI: runs all pilots, writes results/lab_report.json
  results/             # generated reports (gitignored)
```

## Pilots (synthetic conditions — NOT field data)
| id | condition | intent |
|----|-----------|--------|
| arid | hot desert, low rain, sandy | high ET0 / irrigation / scarcity |
| semi_arid | steppe | mid |
| humid | temperate, high rain, loam | low irrigation, humid aridity |
| cold | boreal | low PET / low GDD |
| mediterranean | wet winter / dry summer | seasonal |
| saline | semi-arid + water stress (ks<1) | stress reduces biomass |

## Battery (19 model calls per pilot)
fao56_et0, water_balance, soil_water, crop_water, irrigation, effective_precip,
drought_spi, spi_gamma, thornthwaite, aridity, crop_growth, crop_dssat, aquacrop,
water_footprint, water_productivity, water_scarcity, carbon_4per1000,
calibration, low_flow_7q10.

## Checks
- Per-pilot: every model returns ok; aridity class within expected set.
- Cross-pilot: arid 7Q10 < humid; cold GDD < arid GDD; saline biomass < semi-arid;
  arid scarcity > humid scarcity.

## Run
```
python lab/run_lab.py      # exit 0 = pass
```

All outputs are software-level behaviour checks. Models remain
`NOT_VALIDATED`; this lab does not scientifically validate anything.

## Real-data lab (`lab/real/`)
Fetches **real** daily climate from Open-Meteo (free, CC BY 4.0; cached under
`lab/real/data/`), then:
- computes ET0 with hydroma FAO-56 Penman-Monteith and Hargreaves on the same
  real drivers, and intercompares them with the evaluation metrics (NSE/RMSE/MAE/Bias);
- computes SPI (and SPEI where defined) from real precipitation;
- computes the aridity index and a root-zone bucket over the real year.
Run: `python lab/real/run_real.py` (exit 2 if the source is unreachable — no
fabricated data). This is a real-data intercomparison, **not** validation.