-- ═══════════════════════════════════════════════════════════════════════════
-- FAROL GESTIÓN — Schema completo v1
-- Correr en Supabase: SQL Editor → New query → pegar todo → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- SOCIOS
-- ─────────────────────────────────────────
create table if not exists socio (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  porcentaje  numeric(5,2) not null,
  created_at  timestamptz default now()
);

insert into socio (nombre, porcentaje) values
  ('Pepe',      35.00),
  ('Nahuel',    35.00),
  ('Mica-Diego',30.00)
on conflict do nothing;

-- ─────────────────────────────────────────
-- INSUMOS
-- ─────────────────────────────────────────
create table if not exists insumo (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        text not null check (tipo in ('cerveza','botella','etiqueta','caja','otro')),
  proveedor   text,
  activo      boolean default true,
  created_at  timestamptz default now()
);

create table if not exists insumo_precio_historial (
  id          uuid primary key default gen_random_uuid(),
  insumo_id   uuid not null references insumo(id) on delete cascade,
  precio      numeric(12,2) not null,
  fecha_desde date not null,
  nota        text,
  created_at  timestamptz default now(),
  unique (insumo_id, fecha_desde)
);

-- Vista: precio vigente por insumo
create or replace view insumo_precio_vigente as
select distinct on (insumo_id)
  insumo_id,
  precio,
  fecha_desde
from insumo_precio_historial
order by insumo_id, fecha_desde desc;

-- ─────────────────────────────────────────
-- PRODUCTOS
-- ─────────────────────────────────────────
create table if not exists producto (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  tipo               text not null check (tipo in ('simple','compuesto','promo')),
  sku_base           text check (sku_base in ('rubia','ipa') or sku_base is null),
  margen_pct         numeric(5,2),
  precio_venta       numeric(12,2),
  unidades_por_caja  integer,
  litros             numeric(6,2),
  activo             boolean default true,
  created_at         timestamptz default now()
);

create table if not exists producto_insumo (
  id          uuid primary key default gen_random_uuid(),
  producto_id uuid not null references producto(id) on delete cascade,
  insumo_id   uuid not null references insumo(id),
  cantidad    numeric(10,4) not null,
  unique (producto_id, insumo_id)
);

create table if not exists producto_composicion (
  id              uuid primary key default gen_random_uuid(),
  producto_id     uuid not null references producto(id) on delete cascade,
  componente_id   uuid not null references producto(id),
  cantidad        integer not null,
  es_bonificado   boolean default false,
  unique (producto_id, componente_id)
);

-- ─────────────────────────────────────────
-- LISTAS DE PRECIOS
-- ─────────────────────────────────────────
create table if not exists lista_precios (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  activa      boolean default true,
  created_at  timestamptz default now()
);

create table if not exists lista_precios_item (
  id          uuid primary key default gen_random_uuid(),
  lista_id    uuid not null references lista_precios(id) on delete cascade,
  producto_id uuid not null references producto(id),
  precio      numeric(12,2) not null,
  unique (lista_id, producto_id)
);

-- ─────────────────────────────────────────
-- CLIENTES
-- ─────────────────────────────────────────
create table if not exists cliente (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  comercio            text not null,
  direccion           text,
  telefono            text,
  nota                text,
  fecha_ultimo_pedido date,   -- desnormalizado, actualizado por trigger
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─────────────────────────────────────────
-- PEDIDOS
-- ─────────────────────────────────────────
create table if not exists pedido (
  id                      uuid primary key default gen_random_uuid(),
  numero                  integer generated always as identity,
  cliente_id              uuid not null references cliente(id),
  lista_precios_id        uuid references lista_precios(id),
  total                   numeric(12,2) not null default 0,
  costo_mercaderia_total  numeric(12,2) not null default 0,
  margen                  numeric(12,2) generated always as (total - costo_mercaderia_total) stored,
  fecha_pedido            date not null default current_date,
  fecha_entrega           date,
  fecha_cobro             date,
  estado_entrega          text not null default 'pendiente'
                            check (estado_entrega in ('pendiente','entregado','cancelado')),
  estado_cobro            text not null default 'pendiente'
                            check (estado_cobro in ('pendiente','pagado','no_paga')),
  aclaraciones            text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index if not exists pedido_estados_idx      on pedido(estado_entrega, estado_cobro);
create index if not exists pedido_cliente_fecha_idx on pedido(cliente_id, fecha_pedido desc);

create table if not exists pedido_item (
  id                      uuid primary key default gen_random_uuid(),
  pedido_id               uuid not null references pedido(id) on delete cascade,
  producto_id             uuid not null references producto(id),
  cantidad                integer not null,
  precio_unitario         numeric(12,2) not null,
  costo_unitario_snapshot numeric(12,2) not null,
  subtotal                numeric(12,2) generated always as (cantidad * precio_unitario) stored
);

-- ─────────────────────────────────────────
-- TRIGGER: actualiza fecha_ultimo_pedido en cliente
-- ─────────────────────────────────────────
create or replace function actualizar_fecha_ultimo_pedido()
returns trigger language plpgsql as $$
begin
  update cliente
  set fecha_ultimo_pedido = (
    select max(fecha_pedido)
    from pedido
    where cliente_id = coalesce(NEW.cliente_id, OLD.cliente_id)
      and estado_entrega <> 'cancelado'
  ),
  updated_at = now()
  where id = coalesce(NEW.cliente_id, OLD.cliente_id);
  return NEW;
end;
$$;

drop trigger if exists trig_fecha_ultimo_pedido on pedido;
create trigger trig_fecha_ultimo_pedido
  after insert or update or delete on pedido
  for each row execute function actualizar_fecha_ultimo_pedido();

-- ─────────────────────────────────────────
-- REMITOS
-- ─────────────────────────────────────────
create table if not exists remito (
  id        uuid primary key default gen_random_uuid(),
  numero    integer generated always as identity,
  pedido_id uuid not null references pedido(id) unique,
  fecha     date not null default current_date,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- COMPRAS A PROVEEDOR / STOCK
-- ─────────────────────────────────────────
create table if not exists compra (
  id              uuid primary key default gen_random_uuid(),
  proveedor       text not null,
  insumo_id       uuid references insumo(id),
  cantidad        numeric(10,2) not null,
  precio_unitario numeric(12,2) not null,
  fecha           date not null default current_date,
  nota            text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- GASTOS
-- ─────────────────────────────────────────
create table if not exists gasto (
  id                uuid primary key default gen_random_uuid(),
  descripcion       text not null,
  monto             numeric(12,2) not null,
  tipo              text not null check (tipo in ('fijo','variable')),
  categoria         text not null check (categoria in ('pauta','combustible','peaje','servicios','otro')),
  fecha             date not null default current_date,
  estado_pago       text not null default 'pagado' check (estado_pago in ('pagado','pendiente')),
  fecha_vencimiento date,
  pagado_por        text not null check (pagado_por in ('caja_farol','pepe','nahuel','mica_diego')),
  created_at        timestamptz default now()
);

-- ─────────────────────────────────────────
-- CONFIGURACIÓN
-- ─────────────────────────────────────────
create table if not exists config (
  clave text primary key,
  valor text not null
);

insert into config (clave, valor) values
  ('reserva_pct',        '10'),
  ('alerta_cliente_dias','21')
on conflict (clave) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN
-- ═══════════════════════════════════════════════════════════════════════════
