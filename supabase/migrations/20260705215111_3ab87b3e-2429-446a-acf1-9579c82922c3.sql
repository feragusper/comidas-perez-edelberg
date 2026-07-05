-- ============================================================
-- Comidas + Ingredientes: nuevo modelo de catálogo.
-- ============================================================

CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id text NOT NULL UNIQUE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🥕',
  tags text[] NOT NULL DEFAULT '{}',
  baby_safety text NOT NULL DEFAULT 'caution',
  baby_note text,
  is_keto boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id text NOT NULL UNIQUE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🍽️',
  category text NOT NULL DEFAULT 'Otro',
  baby_safety text NOT NULL DEFAULT 'caution',
  baby_note text,
  is_keto boolean NOT NULL DEFAULT false,
  is_side boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  ingredient_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredients TO authenticated;
GRANT ALL ON public.ingredients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;
GRANT ALL ON public.meals TO service_role;

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed read ingredients" ON public.ingredients
  FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "Allowed insert ingredients" ON public.ingredients
  FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed update ingredients" ON public.ingredients
  FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed delete ingredients" ON public.ingredients
  FOR DELETE TO authenticated USING (public.is_allowed_user());

CREATE POLICY "Allowed read meals" ON public.meals
  FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "Allowed insert meals" ON public.meals
  FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed update meals" ON public.meals
  FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed delete meals" ON public.meals
  FOR DELETE TO authenticated USING (public.is_allowed_user());

ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meals;

-- ── Seed: ingredientes base ──────────────────────────────────

INSERT INTO public.ingredients (ingredient_id, name, emoji, tags, baby_safety, baby_note, is_keto) VALUES
  ('pasta',          'Pasta',            '🍝', '{Carbohidratos/Pasta}',     'safe',    'Bien cocida, sin sal',                false),
  ('pan',            'Pan',              '🍞', '{Carbohidratos/Pan}',       'caution', 'Gluten, porciones pequeñas',          false),
  ('pan-de-pancho',  'Pan de pancho',    '🌭', '{Carbohidratos/Pan}',       'caution', 'Gluten, porciones pequeñas',          false),
  ('pan-rallado',    'Pan rallado',      '🍞', '{Carbohidratos/Pan}',       'caution', 'Gluten',                              false),
  ('harina',         'Harina / Masa',    '🌾', '{Carbohidratos/Masas}',     'caution', 'Gluten',                              false),
  ('masa-pizza',     'Masa de pizza',    '🍕', '{Carbohidratos/Masas}',     'caution', 'Gluten y sal',                        false),
  ('tortilla-wrap',  'Tortilla de wrap', '🌯', '{Carbohidratos/Masas}',     'caution', 'Gluten',                              false),
  ('arroz',          'Arroz',            '🍚', '{Carbohidratos/Arroz}',     'safe',    'Bien cocido, sin sal',                false),
  ('patata',         'Patata',           '🥔', '{Carbohidratos/Patata}',    'safe',    'Bien cocida y blanda',                false),
  ('boniato',        'Boniato',          '🍠', '{Verdura/Tubérculos}',      'safe',    'Muy nutritivo, bien cocido',          false),
  ('lentejas',       'Lentejas',         '🫘', '{Carbohidratos/Legumbres,Proteína/Vegetal}', 'safe', 'Bien cocidas, sin sal', false),
  ('garbanzos',      'Garbanzos',        '🫘', '{Carbohidratos/Legumbres,Proteína/Vegetal}', 'caution', 'Pueden causar gases', false),
  ('avena',          'Avena',            '🥣', '{Carbohidratos/Cereales}',  'safe',    'Sin azúcar añadido',                  false),
  ('quinoa',         'Quinoa',           '🌾', '{Carbohidratos/Cereales}',  'safe',    'Bien lavada y cocida',                false),
  ('cous-cous',      'Cous cous',        '🌾', '{Carbohidratos/Cereales}',  'safe',    'Sin sal extra',                       false),
  ('bulgur',         'Bulgur',           '🌾', '{Carbohidratos/Cereales}',  'safe',    'Grano bien cocido',                   false),
  ('pollo',          'Pollo',            '🍗', '{Proteína/Pollo}',          'safe',    'Desmenuzado, sin hueso ni sal',       true),
  ('pavo',           'Pavo',             '🦃', '{Proteína/Pavo}',           'safe',    'Bien cocido, sin sal',                true),
  ('carne-vaca',     'Ternera',          '🥩', '{Proteína/Vaca}',           'safe',    'Muy tierna y desmenuzada',            true),
  ('carne-picada',   'Carne picada',     '🥩', '{Proteína/Vaca}',           'safe',    'Bien cocida, sin sal',                true),
  ('cerdo',          'Cerdo',            '🥩', '{Proteína/Cerdo}',          'safe',    'Bien cocido, sin sal',                true),
  ('bacon',          'Bacon / Panceta',  '🥓', '{Proteína/Cerdo}',          'caution', 'Mucho sodio, evitar',                 true),
  ('salchicha',      'Salchicha',        '🌭', '{Proteína/Cerdo}',          'caution', 'Ultraprocesado y sodio, evitar',      true),
  ('jamon',          'Jamón',            '🍖', '{Proteína/Cerdo}',          'caution', 'Sodio alto, porciones mínimas',       true),
  ('pescado-blanco', 'Pescado blanco',   '🐟', '{Proteína/Pescado}',        'safe',    'Sin espinas, sin sal',                true),
  ('merluza',        'Merluza',          '🐟', '{Proteína/Pescado}',        'safe',    'Sin espinas, sin sal',                true),
  ('salmon',         'Salmón',           '🐟', '{Proteína/Pescado}',        'safe',    'Sin espinas, sin sal',                true),
  ('atun',           'Atún',             '🐟', '{Proteína/Pescado}',        'safe',    'Sin sal extra',                       true),
  ('dorada',         'Dorada',           '🐠', '{Proteína/Pescado}',        'safe',    'Sin espinas, sin sal',                true),
  ('lubina',         'Lubina',           '🐠', '{Proteína/Pescado}',        'safe',    'Sin espinas, sin sal',                true),
  ('gambas',         'Gambas',           '🍤', '{Proteína/Marisco}',        'unsafe',  'Marisco, evitar hasta 2 años',        true),
  ('calamares',      'Calamares',        '🦑', '{Proteína/Marisco}',        'unsafe',  'Marisco, evitar hasta 2 años',        true),
  ('almejas',        'Almejas',          '🐚', '{Proteína/Marisco}',        'unsafe',  'Marisco, evitar hasta 2 años',        true),
  ('huevo',          'Huevo',            '🥚', '{Proteína/Huevo}',          'safe',    'Bien cocido',                         true),
  ('tofu',           'Tofu',             '🥢', '{Proteína/Vegetal}',        'safe',    'Sin sal ni salsa de soja',            true),
  ('tomate',         'Tomate',           '🍅', '{Verdura/Solanáceas}',      'safe',    'Partir en trozos pequeños',           true),
  ('salsa-tomate',   'Salsa de tomate',  '🥫', '{Verdura/Solanáceas,Otros/Salsa}', 'safe', 'Casera sin sal',                 true),
  ('lechuga',        'Lechuga',          '🥬', '{Verdura/Hojas verdes}',    'safe',    'En trozos pequeños',                  true),
  ('espinaca',       'Espinaca',         '🌿', '{Verdura/Hojas verdes}',    'safe',    'Bien cocida, sin sal',                true),
  ('calabaza',       'Calabaza',         '🎃', '{Verdura/Calabaza}',        'safe',    'Bien cocida y blanda',                true),
  ('calabacin',      'Calabacín',        '🥒', '{Verdura/Calabaza}',        'safe',    'Bien cocido',                         true),
  ('zanahoria',      'Zanahoria',        '🥕', '{Verdura/Tubérculos}',      'safe',    'Cocida y blanda',                     true),
  ('puerro',         'Puerro',           '🥬', '{Verdura/Otras}',           'safe',    'Bien cocido',                         true),
  ('brocoli',        'Brócoli',          '🥦', '{Verdura/Crucíferas}',      'safe',    'Bien cocido en florets',              true),
  ('coliflor',       'Coliflor',         '🥦', '{Verdura/Crucíferas}',      'safe',    'Bien cocida',                         true),
  ('col-lombarda',   'Col lombarda',     '🥬', '{Verdura/Crucíferas}',      'safe',    'Bien cocinada',                       true),
  ('berenjena',      'Berenjena',        '🍆', '{Verdura/Solanáceas}',      'safe',    'Bien cocida',                         true),
  ('pimiento',       'Pimiento',         '🫑', '{Verdura/Solanáceas}',      'safe',    'Bien cocido, sin piel',               true),
  ('cebolla',        'Cebolla',          '🧅', '{Verdura/Otras}',           'safe',    'Bien cocinada',                       true),
  ('ajo',            'Ajo',              '🧄', '{Verdura/Otras}',           'safe',    'En pequeñas cantidades',              true),
  ('champinones',    'Champiñones',      '🍄', '{Verdura/Setas}',           'safe',    'Bien cocinados',                      true),
  ('judias-verdes',  'Judías verdes',    '🫛', '{Verdura/Otras}',           'safe',    'Bien cocidas, sin sal',               true),
  ('pepino',         'Pepino',           '🥒', '{Verdura/Otras}',           'safe',    'Pelado, en bastones',                 true),
  ('verduras-variadas', 'Verduras variadas', '🥗', '{Verdura/Otras}',       'safe',    'Bien cocidas',                        true),
  ('limon',          'Limón',            '🍋', '{Fruta/Cítricos}',          'safe',    NULL,                                  false),
  ('naranja',        'Naranja',          '🍊', '{Fruta/Cítricos}',          'safe',    'En gajos sin piel',                   false),
  ('manzana',        'Manzana',          '🍎', '{Fruta/Pomácea}',           'safe',    'Cocida o rallada para bebé',          false),
  ('pera',           'Pera',             '🍐', '{Fruta/Pomácea}',           'safe',    'Madura y blanda',                     false),
  ('platano',        'Plátano',          '🍌', '{Fruta/Tropical}',          'safe',    'Maduro y blando',                     false),
  ('frutos-rojos',   'Frutos rojos',     '🍓', '{Fruta/Bosque}',            'safe',    'Partidos al medio',                   false),
  ('aguacate',       'Aguacate',         '🥑', '{Fruta/Aguacate}',          'safe',    'Excelente para bebés, en puré',       true),
  ('fruta-variada',  'Fruta variada',    '🍉', '{Fruta/Otras}',             'safe',    'En trozos blandos',                   false),
  ('leche',          'Leche',            '🥛', '{Lácteo/Leche}',            'caution', 'Entera recién desde los 12 meses',    false),
  ('yogur',          'Yogur natural',    '🥛', '{Lácteo/Leche}',            'safe',    'Natural sin azúcar',                  false),
  ('queso',          'Queso',            '🧀', '{Lácteo/Queso}',            'caution', 'Suave y pasteurizado, poco',          true),
  ('nata',           'Nata / Crema',     '🥛', '{Lácteo/Crema}',            'caution', 'Grasa alta, poco',                    true),
  ('mantequilla',    'Mantequilla',      '🧈', '{Lácteo/Crema}',            'caution', 'En pequeñas cantidades',              true),
  ('caldo',          'Caldo',            '🍵', '{Otros/Sopa}',              'safe',    'Casero sin sal',                      false),
  ('pesto',          'Pesto',            '🌿', '{Otros/Salsa}',             'caution', 'Frutos secos y queso, adaptar',       true),
  ('curry',          'Curry',            '🍛', '{Otros/Salsa}',             'caution', 'Especias pueden irritar',             false)
ON CONFLICT (ingredient_id) DO NOTHING;

-- ── Seed: catálogo estático componentizado ───────────────────

INSERT INTO public.meals (meal_id, name, emoji, category, baby_safety, baby_note, is_keto, is_side, tags, ingredient_ids) VALUES
  ('pasta',              'Pasta',                        '🍝', 'Pastas',       'safe',    'Sin sal extra',                              false, false, '{Carbohidratos/Pasta}',                                        '{pasta}'),
  ('pasta-domingo',      'Pasta',                        '🍝', 'Pastas',       'safe',    'Clásico familiar, apto bebé sin sal',        false, false, '{Carbohidratos/Pasta}',                                        '{pasta}'),
  ('lasagna',            'Lasaña',                       '🫕', 'Pastas',       'safe',    'Sin sal extra',                              false, false, '{Carbohidratos/Pasta,Proteína/Vaca,Lácteo/Queso}',             '{pasta,carne-picada,salsa-tomate,queso}'),
  ('ñoquis',             'Ñoquis',                       '🍝', 'Pastas',       'safe',    'Sin sal extra',                              false, false, '{Carbohidratos/Pasta,Carbohidratos/Patata}',                   '{patata,harina}'),
  ('pasta-carbonara',    'Pasta carbonara',              '🍝', 'Pastas',       'caution', 'Yema cruda, evitar',                         false, false, '{Carbohidratos/Pasta,Proteína/Cerdo,Proteína/Huevo}',          '{pasta,bacon,huevo,queso}'),
  ('pasta-boloñesa',     'Pasta boloñesa',               '🍝', 'Pastas',       'safe',    'Sin sal extra, carne bien cocida',           false, false, '{Carbohidratos/Pasta,Proteína/Vaca}',                          '{pasta,carne-picada,salsa-tomate}'),
  ('pasta-pesto',        'Pasta al pesto',               '🍝', 'Pastas',       'safe',    'Sin sal extra',                              false, false, '{Carbohidratos/Pasta,Verdura/Hojas verdes}',                   '{pasta,pesto}'),
  ('canelones',          'Canelones',                    '🫕', 'Pastas',       'safe',    'Sin sal extra',                              false, false, '{Carbohidratos/Pasta,Proteína/Vaca,Lácteo/Queso}',             '{pasta,carne-picada,leche,queso}'),
  ('macarrones',         'Macarrones al horno',          '🍝', 'Pastas',       'safe',    'Sin sal extra',                              false, false, '{Carbohidratos/Pasta,Lácteo/Queso}',                           '{pasta,queso,salsa-tomate}'),
  ('espaguetis-almejas', 'Espaguetis con almejas',       '🐚', 'Pastas',       'unsafe',  'Marisco, evitar en menores de 2 años',       false, false, '{Carbohidratos/Pasta,Proteína/Marisco}',                       '{pasta,almejas,ajo}'),
  ('pollo',              'Pollo asado',                  '🍗', 'Carnes',       'safe',    'Desmenuzado, sin hueso',                     true,  false, '{Proteína/Pollo}',                                             '{pollo}'),
  ('pollo-plancha',      'Pollo a la plancha',           '🍗', 'Carnes',       'safe',    'Desmenuzado, sin sal',                       true,  false, '{Proteína/Pollo}',                                             '{pollo}'),
  ('pollo-curry',        'Pollo al curry',               '🍛', 'Carnes',       'caution', 'Las especias pueden irritar, adaptar',       false, false, '{Proteína/Pollo}',                                             '{pollo,curry}'),
  ('pollo-limon',        'Pollo al limón',               '🍋', 'Carnes',       'safe',    'Sin sal extra',                              true,  false, '{Proteína/Pollo,Fruta/Cítricos}',                              '{pollo,limon}'),
  ('milanesa',           'Milanesa',                     '🥩', 'Carnes',       'caution', 'Evitar apanado o sal',                       false, false, '{Proteína/Vaca,Carbohidratos/Pan}',                            '{carne-vaca,pan-rallado,huevo}'),
  ('carne',              'Carne guisada',                '🥘', 'Carnes',       'safe',    'Sin sal, bien tierna',                       true,  false, '{Proteína/Vaca}',                                              '{carne-vaca,cebolla,zanahoria}'),
  ('albondigas',         'Albóndigas',                   '🍲', 'Carnes',       'safe',    'Sin sal extra',                              false, false, '{Proteína/Vaca}',                                              '{carne-picada,salsa-tomate,pan-rallado}'),
  ('pescado',            'Pescado al horno',             '🐟', 'Carnes',       'safe',    'Sin espinas, sin sal',                       true,  false, '{Proteína/Pescado}',                                           '{pescado-blanco}'),
  ('salmon',             'Salmón',                       '🐟', 'Carnes',       'safe',    'Sin espinas, sin sal',                       true,  false, '{Proteína/Pescado}',                                           '{salmon}'),
  ('salmon-horno',       'Salmón al horno con limón',    '🐟', 'Carnes',       'safe',    'Sin espinas, sin sal',                       true,  false, '{Proteína/Pescado,Fruta/Cítricos}',                            '{salmon,limon}'),
  ('hamburguesa',        'Hamburguesa',                  '🍔', 'Carnes',       'caution', 'Solo carne sin condimentos, sin pan',        true,  false, '{Proteína/Vaca,Carbohidratos/Pan}',                            '{carne-picada,pan,queso,lechuga,tomate}'),
  ('bife',               'Filete de ternera',            '🥩', 'Carnes',       'caution', 'Muy tierno y desmenuzado',                   true,  false, '{Proteína/Vaca}',                                              '{carne-vaca}'),
  ('cerdo-horno',        'Lomo de cerdo al horno',       '🥩', 'Carnes',       'safe',    'Bien cocido, sin sal',                       true,  false, '{Proteína/Cerdo}',                                             '{cerdo}'),
  ('costillas',          'Costillas BBQ',                '🥩', 'Carnes',       'caution', 'Salsa con mucho sodio, evitar',              false, false, '{Proteína/Cerdo}',                                             '{cerdo}'),
  ('cocido',             'Cocido madrileño',             '🍲', 'Carnes',       'safe',    'Sin sal, verduras y legumbres bien cocidas', false, false, '{Proteína/Vaca,Carbohidratos/Legumbres,Verdura/Otras}',        '{carne-vaca,garbanzos,patata,zanahoria}'),
  ('estofado',           'Estofado de ternera',          '🫕', 'Carnes',       'safe',    'Sin sal, bien tierno',                       true,  false, '{Proteína/Vaca}',                                              '{carne-vaca,patata,zanahoria,cebolla}'),
  ('merluza',            'Merluza a la romana',          '🐟', 'Carnes',       'caution', 'Cuidado rebozado y sal',                     false, false, '{Proteína/Pescado}',                                           '{merluza,harina,huevo}'),
  ('merluza-vapor',      'Merluza al vapor',             '🐟', 'Carnes',       'safe',    'Sin espinas, sin sal',                       true,  false, '{Proteína/Pescado}',                                           '{merluza}'),
  ('dorada',             'Dorada al horno',              '🐠', 'Carnes',       'safe',    'Sin espinas, sin sal',                       true,  false, '{Proteína/Pescado}',                                           '{dorada}'),
  ('lubina',             'Lubina a la sal',              '🐠', 'Carnes',       'caution', 'Mucho sodio, adaptar sin sal',               true,  false, '{Proteína/Pescado}',                                           '{lubina}'),
  ('atun',               'Atún con tomate',              '🐟', 'Carnes',       'safe',    'Sin sal extra',                              true,  false, '{Proteína/Pescado,Verdura/Solanáceas}',                        '{atun,salsa-tomate}'),
  ('pollo-verduras',     'Salteado de pollo con verduras','🍗','Carnes',       'safe',    'Sin sal, verduras bien cocidas',             true,  false, '{Proteína/Pollo,Verdura/Otras}',                               '{pollo,verduras-variadas}'),
  ('pavo-plancha',       'Pechuga de pavo',              '🦃', 'Carnes',       'safe',    'Sin sal, bien cocida',                       true,  false, '{Proteína/Pavo}',                                              '{pavo}'),
  ('croquetas',          'Croquetas',                    '🧆', 'Carnes',       'caution', 'Rebozado y sal, adaptar el relleno',         false, false, '{Carbohidratos/Pan,Lácteo/Leche}',                             '{jamon,leche,harina,pan-rallado}'),
  ('calamares',          'Calamares',                    '🦑', 'Carnes',       'unsafe',  'Marisco, evitar hasta 2 años',               false, false, '{Proteína/Marisco}',                                           '{calamares,harina}'),
  ('gambas',             'Gambas al ajillo',             '🍤', 'Carnes',       'unsafe',  'Marisco, evitar hasta 2 años',               false, false, '{Proteína/Marisco}',                                           '{gambas,ajo}'),
  ('tortilla',           'Tortilla de patatas',          '🥚', 'Vegetariano',  'safe',    'Sin sal, bien cocida',                       false, false, '{Proteína/Huevo,Carbohidratos/Patata}',                        '{huevo,patata,cebolla}'),
  ('tortilla-verduras',  'Tortilla de verduras',         '🥚', 'Vegetariano',  'safe',    'Sin sal, bien cocida',                       false, false, '{Proteína/Huevo,Verdura/Otras}',                               '{huevo,verduras-variadas}'),
  ('tarta',              'Tarta salada',                 '🥧', 'Vegetariano',  'caution', 'Masa con gluten, sin sal',                   false, false, '{Carbohidratos/Masas,Proteína/Huevo}',                         '{harina,huevo,verduras-variadas}'),
  ('quiche',             'Quiche lorraine',              '🥧', 'Vegetariano',  'caution', 'Lacteos y gluten, porciones pequeñas',       false, false, '{Carbohidratos/Masas,Proteína/Huevo,Lácteo/Queso}',            '{harina,huevo,queso,bacon,nata}'),
  ('risotto',            'Risotto',                      '🍚', 'Vegetariano',  'safe',    'Sin sal extra',                              false, false, '{Carbohidratos/Arroz,Lácteo/Queso}',                           '{arroz,queso,caldo,champinones}'),
  ('lentejas',           'Lentejas',                     '🫘', 'Vegetariano',  'safe',    'Sin sal, bien cocidas',                      false, false, '{Carbohidratos/Legumbres,Proteína/Vegetal}',                   '{lentejas,zanahoria,cebolla}'),
  ('garbanzos',          'Garbanzos con espinacas',      '🫘', 'Vegetariano',  'caution', 'Pueden causar gases en bebés',               false, false, '{Carbohidratos/Legumbres,Proteína/Vegetal,Verdura/Hojas verdes}','{garbanzos,espinaca}'),
  ('judias-verdes',      'Judías verdes con patata',     '🫘', 'Vegetariano',  'safe',    'Sin sal, bien cocidas',                      false, false, '{Verdura/Otras,Carbohidratos/Patata}',                         '{judias-verdes,patata}'),
  ('pisto',              'Pisto manchego',               '🥘', 'Vegetariano',  'safe',    'Sin sal, bien cocinado',                     false, false, '{Verdura/Solanáceas}',                                         '{tomate,pimiento,calabacin,berenjena,cebolla}'),
  ('revuelto',           'Revuelto de champiñones',      '🥚', 'Vegetariano',  'safe',    'Sin sal, bien cocido',                       true,  false, '{Proteína/Huevo,Verdura/Setas}',                               '{huevo,champinones}'),
  ('wok',                'Wok de verduras',              '🥦', 'Vegetariano',  'caution', 'Sin salsa de soja (sodio alto)',             true,  false, '{Verdura/Otras}',                                              '{verduras-variadas}'),
  ('berenjenas-rellenas','Berenjenas rellenas',          '🍆', 'Vegetariano',  'safe',    'Sin sal, bien cocidas',                      false, false, '{Verdura/Solanáceas}',                                         '{berenjena,carne-picada,queso,tomate}'),
  ('pimientos-rellenos', 'Pimientos rellenos',           '🫑', 'Vegetariano',  'safe',    'Sin sal extra',                              false, false, '{Verdura/Solanáceas,Carbohidratos/Arroz}',                     '{pimiento,arroz,carne-picada}'),
  ('pure-verduras',      'Crema de verduras',            '🎃', 'Vegetariano',  'safe',    'Sin sal ni leche entera',                    false, false, '{Verdura/Otras,Otros/Sopa}',                                   '{verduras-variadas,patata}'),
  ('hummus-veggies',     'Bowl de hummus y verduras',    '🥙', 'Vegetariano',  'caution', 'Tahini con frutos secos, precaución',        true,  false, '{Carbohidratos/Legumbres,Verdura/Otras}',                      '{garbanzos,zanahoria,pepino}'),
  ('falafel',            'Falafel',                      '🧆', 'Vegetariano',  'caution', 'Especias, introducir con cuidado',           false, false, '{Carbohidratos/Legumbres,Proteína/Vegetal}',                   '{garbanzos,cebolla,ajo}'),
  ('tofu-salteado',      'Tofu salteado',                '🥢', 'Vegetariano',  'safe',    'Sin sal, sin salsa de soja',                 true,  false, '{Proteína/Vegetal,Verdura/Otras}',                             '{tofu,verduras-variadas}'),
  ('sopa',               'Sopa de fideos',               '🍜', 'Sopas',        'safe',    'Sin sal, puede tomar el caldo',              false, false, '{Otros/Sopa,Carbohidratos/Pasta}',                             '{pasta,caldo}'),
  ('crema',              'Crema de calabaza',            '🎃', 'Sopas',        'safe',    'Sin sal ni leche entera',                    false, false, '{Otros/Sopa,Verdura/Calabaza}',                                '{calabaza,caldo}'),
  ('crema-zanahoria',    'Crema de zanahoria',           '🥕', 'Sopas',        'safe',    'Sin sal, nutritiva',                         false, false, '{Otros/Sopa,Verdura/Tubérculos}',                              '{zanahoria,caldo}'),
  ('crema-brocoli',      'Crema de brócoli',             '🥦', 'Sopas',        'safe',    'Sin sal, bien licuada',                      false, false, '{Otros/Sopa,Verdura/Crucíferas}',                              '{brocoli,caldo}'),
  ('gazpacho',           'Gazpacho',                     '🍅', 'Sopas',        'caution', 'Crudo, esperar a 12 meses',                  true,  false, '{Otros/Sopa,Verdura/Solanáceas}',                              '{tomate,pimiento,pepino,ajo}'),
  ('salmorejo',          'Salmorejo',                    '🍅', 'Sopas',        'caution', 'Crudo y sal alta, adaptar',                  false, false, '{Otros/Sopa,Verdura/Solanáceas,Carbohidratos/Pan}',            '{tomate,pan,ajo,huevo,jamon}'),
  ('minestrone',         'Minestrone',                   '🍲', 'Sopas',        'safe',    'Sin sal extra',                              false, false, '{Otros/Sopa,Verdura/Otras,Carbohidratos/Pasta}',               '{verduras-variadas,pasta,caldo}'),
  ('caldo-pollo',        'Caldo de pollo',               '🍵', 'Sopas',        'safe',    'Sin sal, excelente para bebés',              false, false, '{Otros/Sopa,Proteína/Pollo}',                                  '{pollo,verduras-variadas}'),
  ('sopa-rabo',          'Sopa de rabo de ternera',      '🍲', 'Sopas',        'safe',    'Sin sal, muy nutritiva',                     false, false, '{Otros/Sopa,Proteína/Vaca}',                                   '{carne-vaca,caldo,verduras-variadas}'),
  ('vichyssoise',        'Vichyssoise',                  '🥛', 'Sopas',        'caution', 'Lácteos, frío puede ser difícil',            false, false, '{Otros/Sopa,Verdura/Tubérculos,Lácteo/Crema}',                 '{puerro,patata,nata,caldo}'),
  ('paella',             'Paella',                       '🥘', 'Arroces',      'caution', 'Marisco, evitar hasta 2 años',               false, false, '{Carbohidratos/Arroz,Proteína/Marisco}',                       '{arroz,pollo,gambas,calamares}'),
  ('arroz-pollo',        'Arroz con pollo',              '🍗', 'Arroces',      'safe',    'Sin sal extra, arroz bien cocido',           false, false, '{Carbohidratos/Arroz,Proteína/Pollo}',                         '{arroz,pollo}'),
  ('arroz-verduras',     'Arroz con verduras',           '🍚', 'Arroces',      'safe',    'Sin sal, bien cocido',                       false, false, '{Carbohidratos/Arroz,Verdura/Otras}',                          '{arroz,verduras-variadas}'),
  ('arroz-negro',        'Arroz negro',                  '🦑', 'Arroces',      'unsafe',  'Tinta de calamar, evitar',                   false, false, '{Carbohidratos/Arroz,Proteína/Marisco}',                       '{arroz,calamares}'),
  ('arroz-leche',        'Arroz con leche',              '🍚', 'Arroces',      'caution', 'Lacteos y azúcar, pequeñas cantidades',      false, false, '{Carbohidratos/Arroz,Lácteo/Leche,Otros/Dulce}',               '{arroz,leche}'),
  ('delivery',           'Delivery',                     '🛵', 'Especiales',   'caution', 'Comida de pedido, adaptar para bebé',        false, false, '{Otros/Especial}',                                             '{}'),
  ('takeaway',           'Takeaway',                     '🥡', 'Especiales',   'caution', 'Comida para llevar, adaptar para bebé',      false, false, '{Otros/Especial}',                                             '{}'),
  ('restaurante',        'Restaurante',                  '🍽️', 'Especiales',   'caution', 'Comemos afuera, adaptar para bebé',          false, false, '{Otros/Especial}',                                             '{}'),
  ('pizza',              'Pizza casera',                 '🍕', 'Especiales',   'caution', 'Solo la miga, sin sal',                      false, false, '{Carbohidratos/Masas,Lácteo/Queso}',                           '{masa-pizza,salsa-tomate,queso}'),
  ('empanadas',          'Empanadillas',                 '🥟', 'Especiales',   'caution', 'Solo el relleno suave, no la masa',          false, false, '{Carbohidratos/Masas,Proteína/Vaca}',                          '{harina,carne-picada,cebolla}'),
  ('bocadillo',          'Bocadillo',                    '🥖', 'Especiales',   'caution', 'Pan con gluten, relleno sin sal',            false, false, '{Carbohidratos/Pan}',                                          '{pan,jamon,queso}'),
  ('wrap',               'Wrap de pollo',                '🌯', 'Especiales',   'safe',    'Sin sal, relleno bien cocinado',             false, false, '{Carbohidratos/Masas,Proteína/Pollo}',                         '{tortilla-wrap,pollo,lechuga}'),
  ('cesar',              'Ensalada César',               '🥗', 'Especiales',   'caution', 'Anchoas y sal alta, adaptar',                true,  false, '{Verdura/Hojas verdes,Proteína/Pollo}',                        '{lechuga,pollo,queso,pan}'),
  ('buddha-bowl',        'Buddha bowl',                  '🥙', 'Especiales',   'safe',    'Sin sal, ingredientes frescos',              true,  false, '{Verdura/Otras,Proteína/Vegetal}',                             '{quinoa,aguacate,verduras-variadas,garbanzos}'),
  ('tabule',             'Tabule',                       '🌿', 'Especiales',   'safe',    'Sin sal extra, grano bien cocido',           false, false, '{Carbohidratos/Cereales,Verdura/Hojas verdes}',                '{bulgur,tomate,pepino}'),
  ('fondue',             'Fondue de queso',              '🫕', 'Especiales',   'unsafe',  'Queso curado y alcohol, evitar',             false, false, '{Lácteo/Queso}',                                               '{queso,pan}'),
  ('pancho',             'Pancho',                       '🌭', 'Especiales',   'caution', 'Salchicha con sodio, evitar para bebé',      false, false, '{Proteína/Cerdo,Carbohidratos/Pan}',                           '{salchicha,pan-de-pancho}'),
  ('side-ensalada',      'Ensalada',                     '🥗', 'Guarniciones', 'safe',    'Sin aderezo, trozos pequeños',               true,  true,  '{Verdura/Hojas verdes}',                                       '{lechuga,tomate}'),
  ('side-ensalada-mixta','Ensalada mixta',               '🥗', 'Guarniciones', 'safe',    'Sin aderezo, trozos pequeños',               true,  true,  '{Verdura/Hojas verdes}',                                       '{lechuga,tomate,cebolla}'),
  ('side-pure',          'Puré de patata',               '🥔', 'Guarniciones', 'safe',    'Sin sal ni leche entera',                    false, true,  '{Carbohidratos/Patata}',                                       '{patata,leche,mantequilla}'),
  ('side-verduras-vapor','Verduras al vapor',            '🥦', 'Guarniciones', 'safe',    'Bien cocidas',                               true,  true,  '{Verdura/Otras}',                                              '{verduras-variadas}'),
  ('side-verduras-horno','Verduras al horno',            '🫑', 'Guarniciones', 'safe',    'Sin sal, bien blandas',                      true,  true,  '{Verdura/Otras}',                                              '{verduras-variadas}'),
  ('side-arroz',         'Arroz blanco',                 '🍚', 'Guarniciones', 'safe',    'Sin sal extra',                              false, true,  '{Carbohidratos/Arroz}',                                        '{arroz}'),
  ('side-papas',         'Patatas fritas',               '🍟', 'Guarniciones', 'caution', 'Mucho aceite y sal, evitar',                 false, true,  '{Carbohidratos/Patata}',                                       '{patata}'),
  ('side-papas-horno',   'Patatas al horno',             '🥔', 'Guarniciones', 'safe',    'Sin sal, bien blandas',                      false, true,  '{Carbohidratos/Patata}',                                       '{patata}'),
  ('side-calabaza',      'Calabaza asada',               '🎃', 'Guarniciones', 'safe',    'Sin sal',                                    true,  true,  '{Verdura/Calabaza}',                                           '{calabaza}'),
  ('side-tomatitos',     'Tomatitos cherry',             '🍅', 'Guarniciones', 'safe',    'Partir al medio para bebé',                  true,  true,  '{Verdura/Solanáceas}',                                         '{tomate}'),
  ('side-batata',        'Boniato asado',                '🍠', 'Guarniciones', 'safe',    'Sin sal, muy nutritivo',                     false, true,  '{Verdura/Tubérculos}',                                         '{boniato}'),
  ('side-espinaca',      'Espinacas salteadas',          '🌿', 'Guarniciones', 'safe',    'Sin sal, bien cocida',                       true,  true,  '{Verdura/Hojas verdes}',                                       '{espinaca,ajo}'),
  ('side-quinoa',        'Quinoa',                       '🌾', 'Guarniciones', 'safe',    'Bien lavada y cocida',                       false, true,  '{Carbohidratos/Cereales}',                                     '{quinoa}'),
  ('side-brocoli',       'Brócoli',                      '🥦', 'Guarniciones', 'safe',    'Sin sal, bien cocido en florets',            true,  true,  '{Verdura/Crucíferas}',                                         '{brocoli}'),
  ('side-zanahoria',     'Zanahorias',                   '🥕', 'Guarniciones', 'safe',    'Cocidas y blandas para bebé',                true,  true,  '{Verdura/Tubérculos}',                                         '{zanahoria}'),
  ('side-champinones',   'Champiñones salteados',        '🍄', 'Guarniciones', 'safe',    'Sin sal, bien cocinados',                    true,  true,  '{Verdura/Setas}',                                              '{champinones,ajo}'),
  ('side-col-lombarda',  'Col lombarda',                 '🥬', 'Guarniciones', 'safe',    'Sin sal, bien cocinada',                     true,  true,  '{Verdura/Crucíferas}',                                         '{col-lombarda}'),
  ('side-cous-cous',     'Cous cous',                    '🌾', 'Guarniciones', 'safe',    'Sin sal extra',                              false, true,  '{Carbohidratos/Cereales}',                                     '{cous-cous}'),
  ('side-pan',           'Pan',                          '🍞', 'Guarniciones', 'caution', 'Gluten, porciones pequeñas',                 false, true,  '{Carbohidratos/Pan}',                                          '{pan}'),
  ('side-judias-verdes', 'Judías verdes',                '🫛', 'Guarniciones', 'safe',    'Sin sal, bien cocidas',                      true,  true,  '{Verdura/Otras}',                                              '{judias-verdes}'),
  ('side-pisto',         'Pisto',                        '🥘', 'Guarniciones', 'safe',    'Sin sal, bien cocinado',                     false, true,  '{Verdura/Solanáceas}',                                         '{tomate,pimiento,calabacin,berenjena}'),
  ('side-aguacate',      'Aguacate',                     '🥑', 'Guarniciones', 'safe',    'Excelente para bebés, en puré',              true,  true,  '{Fruta/Aguacate}',                                             '{aguacate}'),
  ('des-avena',          'Avena con fruta',              '🥣', 'Desayunos',    'safe',    'Sin azúcar, fruta blanda',                   false, false, '{Carbohidratos/Cereales,Fruta/Otras}',                         '{avena,fruta-variada,leche}'),
  ('des-yogur',          'Yogur con fruta',              '🥛', 'Desayunos',    'safe',    'Yogur natural sin azúcar',                   false, false, '{Lácteo/Yogur,Fruta/Otras}',                                   '{yogur,fruta-variada}'),
  ('des-tostada-aguacate','Tostada con aguacate',        '🥑', 'Desayunos',    'caution', 'Pan con gluten, en trozos pequeños',         false, false, '{Carbohidratos/Pan,Fruta/Aguacate}',                           '{pan,aguacate}'),
  ('des-tortitas',       'Tortitas de avena',            '🥞', 'Desayunos',    'safe',    'Sin azúcar añadido',                         false, false, '{Carbohidratos/Cereales}',                                     '{avena,huevo,leche}'),
  ('des-fruta',          'Fruta variada',                '🍓', 'Desayunos',    'safe',    'En trozos blandos',                          false, false, '{Fruta/Otras}',                                                '{fruta-variada}'),
  ('des-huevo',          'Huevo revuelto',               '🥚', 'Desayunos',    'safe',    'Bien cocido, sin sal',                       false, false, '{Proteína/Huevo}',                                             '{huevo}'),
  ('des-pan-tomate',     'Pan con tomate',               '🍅', 'Desayunos',    'caution', 'Pan con gluten, sin sal',                    false, false, '{Carbohidratos/Pan,Verdura/Solanáceas}',                       '{pan,tomate}'),
  ('des-pancakes-platano','Tortitas de plátano',         '🍌', 'Desayunos',    'safe',    'Solo plátano y huevo',                       false, false, '{Fruta/Otras,Proteína/Huevo}',                                 '{platano,huevo}'),
  ('mer-fruta',          'Fruta',                        '🍎', 'Meriendas',    'safe',    'En trozos blandos',                          false, false, '{Fruta/Otras}',                                                '{fruta-variada}'),
  ('mer-yogur',          'Yogur',                        '🥛', 'Meriendas',    'safe',    'Natural sin azúcar',                         false, false, '{Lácteo/Yogur}',                                               '{yogur}'),
  ('mer-queso',          'Queso con pan',                '🧀', 'Meriendas',    'caution', 'Queso suave, pan con gluten',                false, false, '{Lácteo/Queso,Carbohidratos/Pan}',                             '{queso,pan}'),
  ('mer-galletas-avena', 'Galletas de avena',            '🍪', 'Meriendas',    'safe',    'Caseras sin azúcar',                         false, false, '{Carbohidratos/Cereales}',                                     '{avena,huevo}'),
  ('mer-batido',         'Batido de fruta',              '🥤', 'Meriendas',    'safe',    'Fruta y leche, sin azúcar',                  false, false, '{Fruta/Otras,Lácteo/Leche}',                                   '{fruta-variada,leche}'),
  ('mer-platano',        'Plátano',                      '🍌', 'Meriendas',    'safe',    'Maduro y blando',                            false, false, '{Fruta/Otras}',                                                '{platano}'),
  ('mer-hummus',         'Hummus con palitos',           '🥕', 'Meriendas',    'caution', 'Verduras blandas, hummus suave',             false, false, '{Carbohidratos/Legumbres,Verdura/Otras}',                      '{garbanzos,zanahoria,pepino}'),
  ('mer-tostada-queso',  'Tostada con queso',            '🧀', 'Meriendas',    'caution', 'Pan con gluten, queso suave',                false, false, '{Carbohidratos/Pan,Lácteo/Queso}',                             '{pan,queso}')
ON CONFLICT (meal_id) DO NOTHING;

-- ── Copia de custom_meals -> meals ───────────────────────────

INSERT INTO public.meals (meal_id, name, emoji, category, baby_safety, baby_note, is_keto, is_side, tags, created_at)
SELECT meal_id, name, emoji, category, baby_safety, baby_note, is_keto, is_side, COALESCE(tags, '{}'), created_at
FROM public.custom_meals
ON CONFLICT (meal_id) DO NOTHING;