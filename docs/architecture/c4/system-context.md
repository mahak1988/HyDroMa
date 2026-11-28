# C1 — System Context

**Status:** SCAFFOLDED. Context diagram. Solid = existing; dashed = planned. Boxes in `[[ ]]` exist.

```mermaid
flowchart TB
  subgraph Actors
    U[[User]]
    ORG[Organization member/admin]
    SCI[Scientist]
    ADM[Platform admin]
  end

  SYS[[Eco Nojin Platform]]

  U -->|browse, buy, book| SYS
  ORG -->|manage org, projects| SYS
  SCI -->|run scenarios, view provenance| SYS
  ADM -->|administer, review| SYS

  SYS -.->|satellite/weather/geospatial data| EXT1[External data providers]
  SYS -.->|model inference| EXT2[AI providers]
  SYS -.->|payments| EXT3[Payment providers]
  SYS -.->|email/SMS/push| EXT4[Notification providers]
  SYS -.->|carbon registry submission| EXT5[External MRV registries]
```

## Notes

- Users, organizations, scientists and admins are **actors**, not components.
- External providers are **outside** the system boundary and are reached only through adapters
  (dashed = planned; none active).
- The platform is a single system; its internal containers are in the C2 diagram.