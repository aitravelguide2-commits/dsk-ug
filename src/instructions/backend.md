# 🛠️ Admin Dashboard für Vue Unterkunfts-Buchungsplattform  
*(Komplette Implementierungsanleitung für TRAE)*

---

## 1. Übersicht & Zielsetzung
- **Ziel**: Admin-Dashboard, mit dem Unterkünfte, Buchungen, Inhalte & Bilder **ohne Code-Änderung** verwaltet werden können.  
- **Scope**:  
  – Login-geschützt (Rollen: Admin | Editor | Viewer)  
  – CRUD für Unterkünfte inkl. Bild-Upload & Drag-Drop  
  – Buchungsübersicht mit Status, Filtern, Export  
  – dynamische Inhalte (Startseite, Landing-Pages) editierbar  
  – Charts & KPIs (Umsatz, Auslastung, neue Buchungen)  
  – 100 % modular → einfach erweiterbar

---

## 2. Tech-Stack & Projektstruktur
project-root/
├─ backend/                 → Express + Sequelize + JWT + Multer
├─ admin-frontend/          → Vite + Vue 3 + Pinia + Vue-Router
├─ docker-compose.yml       → 1-Klick Deployment
└─ docs/                    → weitere Docs (optional)


---

## 3. Backend (Express) – Schritt für Schritt

### 3.1 Installation & .env
```bash
cd backend
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken multer sequelize mysql2
npm install -D nodemon

.env

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=__ROOT_PW__
DB_NAME=booking_admin
JWT_SECRET=mindestens-32-zeichen-geheimer-key
JWT_EXPIRE=24h
UPLOAD_PATH=uploads/images



### 3.2 Entry-Point server.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import sequelize from './config/db.js';
import models from './models/index.js';          // auto-index
import routes from './routes/index.js';          // index-router
import errorHandler from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_PATH)));

await sequelize.sync({ alter: true });
console.log('✅ DB synchronised');

app.use('/api', routes);
app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`🚀 API on http://localhost:${process.env.PORT}`)
);

### 3.3 Konfiguration & Middleware

import { Sequelize } from 'sequelize';
export default new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: 'mysql', logging: false }
);

middleware/auth.js

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  const hdr = req.headers.authorization;
  if (!hdr) return res.status(401).json({ msg: 'Kein Token' });

  try {
    const { id } = jwt.verify(hdr.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findByPk(id);
    next();
  } catch (e) {
    res.status(403).json({ msg: 'Token ungültig' });
  }
};

export const permit = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ msg: 'Keine Rechte' });

  middleware/upload.js
  import multer from 'multer';
import path from 'path';
import { randomBytes } from 'crypto';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_PATH),
  filename: (req, file, cb) =>
    cb(null, `${randomBytes(8).toString('hex')}${path.extname(file.originalname)}`)
});
const fileFilter = (req, file, cb) =>
  /jpe?g|png|webp/i.test(path.extname(file.originalname)) ? cb(null, true) : cb(new Error('Nur Bilder'));

export default multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

3.4 Models (kurz)
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  name:     { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.ENUM('admin','editor','viewer'), defaultValue: 'viewer' }
}, {
  hooks: { beforeCreate: async (u) => u.password = await bcrypt.hash(u.password, 12) },
  instanceMethods: {
    validatePassword(pw) { return bcrypt.compare(pw, this.password); }
  }
});

export default User;

models/Accommodation.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

export default sequelize.define('Accommodation', {
  name:           { type: DataTypes.STRING, allowNull: false },
  description:    { type: DataTypes.TEXT, allowNull: false },
  price_per_night:{ type: DataTypes.DECIMAL(10,2), allowNull: false },
  max_guests:     { type: DataTypes.INTEGER, allowNull: false },
  images:         { type: DataTypes.JSON, defaultValue: [] },
  amenities:      { type: DataTypes.JSON, defaultValue: [] },
  is_active:      { type: DataTypes.BOOLEAN, defaultValue: true }
});

models/Booking.js

/* Felder: id, accommodation_id, guest_name, guest_email,
   check_in, check_out, total_price, status, notes, timestamps */
models/PageContent.js
/* page, section, content(JSON), last_modified_by */

3.5 Routes & Controller (kompakt)

routes/auth.js

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.validatePassword(password)))
    return res.status(401).json({ msg: 'Ungültig' });
  res.json({ token: sign(user.id), user });
});
router.get('/me', authenticate, (req, res) => res.json(req.user));

export default router;

routes/accommodations.js

import express from 'express';
import Accommodation from '../models/Accommodation.js';
import { authenticate, permit } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
const router = express.Router();

router.get   ('/',            authenticate, async (req, res) => res.json(await Accommodation.findAll({ order: [['updatedAt','DESC']] })));
router.get   ('/:id',         authenticate, async (req, res) => res.json(await Accommodation.findByPk(req.params.id)));
router.post  ('/',            authenticate, permit('admin','editor'), async (req, res) => res.status(201).json(await Accommodation.create(req.body)));
router.put   ('/:id',         authenticate, permit('admin','editor'), async (req, res) => {
  const acc = await Accommodation.findByPk(req.params.id);
  await acc.update(req.body);
  res.json(acc);
});
router.delete('/:id',         authenticate, permit('admin'),        async (req, res) => {
  await Accommodation.destroy({ where: { id: req.params.id }});
  res.json({ msg: 'gelöscht' });
});
router.post  ('/:id/images',  authenticate, permit('admin','editor'), upload.array('images',10), async (req,res) => {
  const acc = await Accommodation.findByPk(req.params.id);
  const imgs = req.files.map(f => ({ url: `/uploads/${f.filename}`, filename: f.filename }));
  await acc.update({ images: [...acc.images, ...imgs] });
  res.json(acc.images);
});
router.delete('/:id/images/:file', authenticate, permit('admin','editor'), async (req,res) => {
  const acc = await Accommodation.findByPk(req.params.id);
  const remaining = acc.images.filter(i => i.filename !== req.params.file);
  await acc.update({ images: remaining });
  res.json(remaining);
});

export default router;

routes/dashboard.js

import express from 'express';
import { sequelize } from '../models/index.js';
const router = express.Router();

router.get('/stats', async (req, res) => {
  const [ [{ totalBookings, totalRevenue }] ] = await sequelize.query(
    'SELECT COUNT(*) AS totalBookings, COALESCE(SUM(total_price),0) AS totalRevenue FROM Bookings WHERE status="completed"'
  );
  const totalAcc = await sequelize.models.Accommodation.count();
  const pending  = await sequelize.models.Booking.count({ where: { status: 'pending' } });
  res.json({ totalBookings, totalRevenue, totalAccommodations: totalAcc, pendingBookings: pending });
});

router.get('/bookings-by-month', async (req, res) => {
  const { start, end } = req.query;
  const [ [{ count }] ] = await sequelize.query(
    'SELECT COUNT(*) AS count FROM Bookings WHERE createdAt BETWEEN ? AND ?',
    { replacements: [start, end] }
  );
  res.json({ count });
});

export default router;

3.6 Error-Handler

middleware/error.js
export default (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ msg: err.message || 'Serverfehler' });
};

4. Frontend (Vue 3) – Schritt für Schritt

4.1 Scaffold & Libs
npm create vite@latest admin-frontend --template vue
cd admin-frontend
npm i pinia vue-router axios quasar @quasar/extras chart.js date-fns vee-validate @vee-validate/rules

4.2 Ordnerstruktur (gekürzt)
src/
├─ main.js
├─ App.vue
├─ router/index.js
├─ stores/        (auth.js  accommodations.js  bookings.js  dashboard.js)
├─ services/api.js
├─ views/         (Login.vue  Dashboard.vue  Accommodations.vue  AccommodationEdit.vue  Bookings.vue  ContentEditor.vue)
├─ components/    (layout/  ui/  charts/)
└─ utils/helpers.js

4.3 API-Service
services/api.js

import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://backend-dsk.tripvega.com/api' });
api.interceptors.request.use(cfg => {
  const t = localStorage.token;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(null, err => {
  if (err.response?.status === 401) { localStorage.clear(); location.href = '/login'; }
  return Promise.reject(err);
});
export default api;

4.4 Pinia – Auth-Store
stores/auth.js

import { defineStore } from 'pinia';
import api from '../services/api.js';

export const useAuth = defineStore('auth', {
  state: () => ({ user: null, token: localStorage.token }),
  getters: { isAuth: s => !!s.token, isAdmin: s => s.user?.role === 'admin', canEdit: s => ['admin','editor'].includes(s.user?.role) },
  actions: {
    async login(creds) {
      const { data } = await api.post('/auth/login', creds);
      this.token = data.token; this.user = data.user;
      localStorage.token = data.token;
    },
    logout() { localStorage.clear(); this.$reset(); }
  }
});

4.5 Router

router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../stores/auth.js';

const routes = [
  { path: '/login',        component: () => import('../views/Login.vue'), meta: { guest: true } },
  { path: '/',             component: () => import('../views/Dashboard.vue'), meta: { auth: true } },
  { path: '/accommodations', component: () => import('../views/Accommodations.vue'), meta: { auth: true } },
  { path: '/accommodations/:id', component: () => import('../views/AccommodationEdit.vue'), meta: { auth: true, edit: true } },
  { path: '/bookings',     component: () => import('../views/Bookings.vue'), meta: { auth: true } },
  { path: '/content',      component: () => import('../views/ContentEditor.vue'), meta: { auth: true, edit: true } }
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(async (to, from, next) => {
  const a = useAuth();
  if (to.meta.auth && !a.isAuth) return next('/login');
  if (to.meta.edit && !a.canEdit) return next('/');
  next();
});

export default router;

4.6 Views (Snippets)

views/Login.vue
<template>
  <div class="grid h-screen place-items-center">
    <q-card class="p-6 w-96">
      <q-card-section><div class="text-h6">Admin Login</div></q-card-section>
      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input v-model="form.email" type="email" label="E-Mail" required />
        <q-input v-model="form.password" type="password" label="Passwort" required />
        <q-btn type="submit" label="Login" color="primary" class="full-width"/>
      </q-form>
    </q-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useAuth } from '../stores/auth.js';
import { useRouter } from 'vue-router';
const auth = useAuth(); const router = useRouter();
const form = reactive({ email: '', password: '' });
const onSubmit = async () => { await auth.login(form); router.push('/'); };
</script>

views/Dashboard.vue
<template>
  <div class="p-4">
    <div class="text-h4 q-mb-md">Dashboard</div>
    <div class="row q-col-gutter-md q-mb-lg">
      <stat-card class="col-12 col-sm-6 col-md-3" title="Buchungen" :value="stats.totalBookings"/>
      <stat-card class="col-12 col-sm-6 col-md-3" title="Umsatz" :value="`€ ${stats.totalRevenue}`"/>
      <stat-card class="col-12 col-sm-6 col-md-3" title="Unterkünfte" :value="stats.totalAccommodations"/>
      <stat-card class="col-12 col-sm-6 col-md-3" title="Offen" :value="stats.pendingBookings"/>
    </div>
    <booking-chart :data="chartData"/>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useDashboard } from '../stores/dashboard.js';
import StatCard from '../components/ui/StatCard.vue';
import BookingChart from '../components/charts/BookingChart.vue';
const d = useDashboard();
onMounted(() => { d.fetchStats(); d.fetchChart(); });
const { stats, chartData } = $(d);
</script>

views/AccommodationEdit.vue
<template>
  <q-page class="p-4">
    <q-form @submit="save" class="q-gutter-md">
      <q-input v-model="acc.name" label="Name" :rules="[val=>!!val]"/>
      <q-input v-model.number="acc.price_per_night" type="number" step="0.01" label="Preis/Nacht"/>
      <q-input v-model.number="acc.max_guests" type="number" label="Max Gäste"/>
      <q-editor v-model="acc.description" min-height="10rem"/>
      <image-uploader :images="acc.images" @uploaded="onUpload" @removed="onRemove"/>
      <q-btn label="Speichern" type="submit" color="primary"/>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccommodations } from '../stores/accommodations.js';
const route = useRoute(); const router = useRouter(); const store = useAccommodations();
const acc = ref({ images:[] });
onMounted(async () => { await store.fetchOne(route.params.id); acc.value = store.current; });
const save = async () => { await store.update(acc.value.id, acc.value); router.push('/accommodations'); };
const onUpload = (imgs) => acc.value.images = imgs;
const onRemove = (file) => store.deleteImage(acc.value.id, file);
</script>

5. Re-usable Komponenten
components/ui/StatCard.vue

<template>
  <q-card>
    <q-card-section class="text-center">
      <div class="text-caption text-grey">{{ title }}</div>
      <div class="text-h5">{{ value }}</div>
    </q-card-section>
  </q-card>
</template>
<script setup> defineProps(['title','value']) </script>

components/charts/BookingChart.vue

<template><canvas ref="canv"></canvas></template>
<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';
const props = defineProps({ data: Object });
const canv = ref(null); let chart;
watch(() => props.data, (d) => {
  if (chart) chart.destroy();
  chart = new Chart(canv.value, { type: 'line', data: d, options: { responsive: true } });
}, { immediate: true });
</script>

components/ui/ImageUploader.vue

<template>
  <div>
    <q-uploader multiple accept=".jpg,.jpeg,.png,.webp" :url="url" @uploaded="emit('uploaded', files)"/>
    <div class="row q-gutter-sm q-mt-md">
      <q-img v-for="img in images" :key="img.filename" :src="img.url" style="width:150px" @click="emit('removed', img.filename)"/>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
const props = defineProps({ images: Array });
const emit = defineEmits(['uploaded','removed']);
const url = computed(() => `/api/accommodations/${props.id}/images`);
</script>
6. Stores (gekürzt)
stores/accommodations.js

import { defineStore } from 'pinia';
import api from '../services/api.js';

export const useAccommodations = defineStore('accommodations', {
  state: () => ({ items: [], current: null }),
  actions: {
    async fetchAll()   { this.items = (await api.get('/accommodations')).data; },
    async fetchOne(id) { this.current = (await api.get(`/accommodations/${id}`)).data; },
    async create(payload)      { await api.post('/accommodations', payload); await this.fetchAll(); },
    async update(id, payload)  { await api.put(`/accommodations/${id}`, payload); },
    async delete(id)           { await api.delete(`/accommodations/${id}`);  await this.fetchAll(); },
    async uploadImages(id, files) {
      const fd = new FormData(); files.forEach(f => fd.append('images', f));
      const { data } = await api.post(`/accommodations/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (this.current?.id === id) this.current.images = data.images;
    },
    async deleteImage(id, file) {
      await api.delete(`/accommodations/${id}/images/${file}`);
      if (this.current?.id === id) this.current.images = this.current.images.filter(i => i.filename !== file);
    }
  }
});
stores/dashboard.js

import { defineStore } from 'pinia';
import api from '../services/api.js';

export const useDashboard = defineStore('dashboard', {
  state: () => ({ stats: {}, recent: [], chart: { labels:[], datasets:[] } }),
  actions: {
    async fetchStats()  { this.stats  = (await api.get('/dashboard/stats')).data; },
    async fetchRecent() { this.recent = (await api.get('/dashboard/recent-bookings')).data; },
    async fetchChart()  {
      const { data } = await api.get('/dashboard/chart-data');
      this.chart = data;
    }
  }
});
7. Content-Editor Page
views/ContentEditor.vue

<template>
  <q-page class="p-4">
    <div class="row q-col-gutter-lg">
      <q-list bordered class="col-12 col-sm-4">
        <q-item v-for="p in pages" :key="p" clickable @click="load(p)" :class="p===page?'bg-blue-1':''">
          <q-item-section>{{ p }}</q-item-section>
        </q-item>
      </q-list>
      <div v-if="content" class="col-12 col-sm-8">
        <q-form @submit="save">
          <q-input v-for="(v,k) in content" :key="k" v-model="content[k]" :label="k" class="q-mb-md"/>
          <q-btn label="Speichern" type="submit" color="primary"/>
        </q-form>
      </div>
    </div>
  </q-page>
</template>
<script setup>
import { ref } from 'vue';
import api from '../services/api.js';
const pages = ['Startseite','Über uns','Kontakt','FAQ'];
const page  = ref('');
const content = ref(null);
const load = async (p) => {
  page.value = p;
  const { data } = await api.get(`/content?page=${p}`);
  content.value = data.content || {};
};
const save = async () => {
  await api.post('/content', { page: page.value, section: 'main', content: content.value });
};
</script>
8. Deployment mit Docker
docker-compose.yml

version: "3.9"
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: booking_admin
    volumes: [mysql_vol:/var/lib/mysql]
    ports: ["3306:3306"]

  api:
    build: ./backend
    env_file: [.env]
    ports: ["5000:5000"]
    depends_on: [db]

  admin:
    build: ./admin-frontend
    ports: ["8080:80"]
    depends_on: [api]

volumes: mysql_vol:
backend/Dockerfile


FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node","server.js"]
admin-frontend/Dockerfile

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
9. Erstellen des ersten Admins
backend/scripts/create-admin.js

import 'dotenv/config';
import '../config/db.js';
import User from '../models/User.js';
await User.create({ email:'admin@site.de', password:'123456', name:'Boss', role:'admin' });
console.log('✅ Admin erstellt');
process.exit();
package.json → "create-admin": "node scripts/create-admin.js"
10. Sicherheit & Best-Practice Checkliste
[ ] Bcrypt ≥ 12 Runden
[ ] JWT-Secret 32+ Zeichen, TTL 24 h
[ ] CORS auf Admin-Domain beschränken
[ ] Rate-Limit (express-rate-limit)
[ ] Input-Validierung (server-seitig)
[ ] File-Type + Size Check
[ ] HTTPS nur (nginx ssl)
[ ] ENV-Secrets nie im Repo
11. Nächste Schritte / Erweiterungen
Kalender-Komponente für Belegung
E-Mail-Versand (z. B. nodemailer)
Mehrsprachigkeit (vue-i18n)
Rollen-basierte Menüs
Export (CSV, PDF)
Fertig! Kopiere die einzelnen Abschnitte in TRAE, starte Backend → Frontend → Docker und du hast ein vollwertiges Admin-Dashboard für deine Vue-Buchungsplattform.



