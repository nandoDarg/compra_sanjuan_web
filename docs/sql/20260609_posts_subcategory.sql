-- Agrega soporte jerarquico de categorias en publicaciones.
-- Ejecutar en Supabase SQL Editor.

create extension if not exists unaccent;

alter table public.posts
add column if not exists subcategory text;

-- Migra categorias existentes a categoria principal + subcategoria cuando es posible.
with normalized as (
  select
    id,
    lower(
      regexp_replace(
        unaccent(trim(coalesce(category, ''))),
        '\\s+',
        ' ',
        'g'
      )
    ) as category_key
  from public.posts
)
update public.posts p
set
  category = mapped.category,
  subcategory = mapped.subcategory
from (
  select
    id,
    case
      when category_key in ('auto', 'autos', 'automotores', 'vehiculo', 'vehiculos') then 'Vehiculos'
      when category_key in ('camioneta', 'camionetas') then 'Vehiculos'
      when category_key in ('moto', 'motos') then 'Vehiculos'
      when category_key in ('camion', 'camiones') then 'Vehiculos'
      when category_key in ('utilitario', 'utilitarios') then 'Vehiculos'
      when category_key in ('tecnologia', 'celular', 'celulares', 'telefono', 'telefonos', 'smartphone', 'smartphones', 'tablet', 'tablets', 'notebook', 'notebooks', 'laptop', 'laptops', 'pc', 'computadora', 'computadoras', 'smart tv', 'smarttv', 'tv') then 'Tecnologia'
      when category_key in ('hogar', 'hogar y muebles', 'mueble', 'muebles', 'electrodomestico', 'electrodomesticos', 'jardin') then 'Hogar y Muebles'
      when category_key in ('inmueble', 'inmuebles', 'casa', 'casas', 'departamento', 'departamentos', 'terreno', 'terrenos', 'oficina', 'oficinas') then 'Inmuebles'
      when category_key in ('deporte', 'deportes', 'salud y deportes', 'bicicleta', 'bicicletas') then 'Deportes y Fitness'
      when category_key in ('moda', 'moda y belleza', 'calzado', 'ropa', 'hombre', 'mujer') then 'Moda'
      when category_key in ('bebes y ninos', 'ninos y bebes', 'juguetes', 'cochecitos') then 'Ninos y Bebes'
      when category_key in ('empleo', 'ofertas laborales', 'servicios profesionales') then 'Empleo'
      when category_key in ('servicio', 'servicios', 'construccion', 'electricidad', 'plomeria', 'informatica', 'diseno', 'clases particulares', 'transporte') then 'Servicios'
      when category_key in ('agro', 'maquinaria agricola', 'insumos', 'ganaderia') then 'Agro'
      when category_key in ('mascota', 'mascotas', 'perros', 'gatos') then 'Mascotas'
      else coalesce(nullif(category, ''), 'Otros')
    end as category,
    case
      when category_key in ('auto', 'autos', 'automotores', 'vehiculo', 'vehiculos') then 'Autos'
      when category_key in ('camioneta', 'camionetas') then 'Camionetas'
      when category_key in ('moto', 'motos') then 'Motos'
      when category_key in ('camion', 'camiones') then 'Camiones'
      when category_key in ('utilitario', 'utilitarios') then 'Utilitarios'
      when category_key in ('celular', 'celulares', 'telefono', 'telefonos', 'smartphone', 'smartphones') then 'Celulares'
      when category_key in ('tablet', 'tablets') then 'Tablets'
      when category_key in ('notebook', 'notebooks', 'laptop', 'laptops') then 'Notebooks'
      when category_key in ('pc', 'computadora', 'computadoras') then 'PCs de Escritorio'
      when category_key in ('smart tv', 'smarttv', 'tv') then 'Smart TVs'
      when category_key in ('mueble', 'muebles') then 'Muebles'
      when category_key in ('electrodomestico', 'electrodomesticos') then 'Electrodomesticos'
      when category_key in ('jardin') then 'Jardin'
      when category_key in ('casa', 'casas') then 'Casas'
      when category_key in ('departamento', 'departamentos') then 'Departamentos'
      when category_key in ('terreno', 'terrenos') then 'Terrenos'
      when category_key in ('oficina', 'oficinas') then 'Oficinas'
      when category_key in ('bicicleta', 'bicicletas') then 'Bicicletas'
      when category_key in ('calzado') then 'Calzado'
      when category_key in ('ropa') then 'Ropa'
      when category_key in ('hombre') then 'Hombre'
      when category_key in ('mujer') then 'Mujer'
      when category_key in ('juguetes') then 'Juguetes'
      when category_key in ('cochecitos') then 'Cochecitos'
      when category_key in ('ofertas laborales') then 'Ofertas Laborales'
      when category_key in ('servicios profesionales') then 'Servicios Profesionales'
      when category_key in ('construccion') then 'Construccion'
      when category_key in ('electricidad') then 'Electricidad'
      when category_key in ('plomeria') then 'Plomeria'
      when category_key in ('informatica') then 'Informatica'
      when category_key in ('diseno') then 'Diseno'
      when category_key in ('clases particulares') then 'Clases Particulares'
      when category_key in ('transporte') then 'Transporte'
      when category_key in ('maquinaria agricola') then 'Maquinaria Agricola'
      when category_key in ('insumos') then 'Insumos'
      when category_key in ('ganaderia') then 'Ganaderia'
      when category_key in ('perros') then 'Perros'
      when category_key in ('gatos') then 'Gatos'
      when category_key in ('otros', 'varios') then 'Varios'
      else coalesce(nullif(subcategory, ''), null)
    end as subcategory
  from normalized
  join public.posts using (id)
) as mapped
where p.id = mapped.id;

create index if not exists posts_category_subcategory_idx
on public.posts (category, subcategory);
