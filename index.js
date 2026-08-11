#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import chalk from 'chalk';

const projectName = process.argv[2] || 'teste';
const rootDir = path.join(process.cwd(), projectName);

async function setup() {
  console.log(chalk.blue(`\n🚀 Criando o projeto em: ${rootDir}\n`));

  // 1. Criar pastas base
  await fs.ensureDir(path.join(rootDir, 'back/src/Config'));
  await fs.ensureDir(path.join(rootDir, 'back/src/Controllers'));
  await fs.ensureDir(path.join(rootDir, 'back/src/Middlewares'));
  await fs.ensureDir(path.join(rootDir, 'back/src/Model'));
  await fs.ensureDir(path.join(rootDir, 'back/src/Routes'));
  await fs.ensureDir(path.join(rootDir, 'back/src/Zod'));

  // 2. Configurar BACKEND
  console.log(chalk.yellow('📦 Configurando Backend...'));
  
  await fs.writeFile(path.join(rootDir, 'back/server.js'), '');
  await fs.writeFile(path.join(rootDir, 'back/.env'), '');
  await fs.writeFile(path.join(rootDir, 'back/.gitignore'), "node_modules/\n.env\ndist/\n");

  const backPackage = {
    name: "back",
    version: "1.0.0",
    main: "server.js",
    scripts: {
      "dev": "npx nodemon server.js"
    },
    dependencies: {
      "bcrypt": "^5.1.1",
      "cors": "^2.8.5",
      "dotenv": "^16.4.7",
      "express": "^5.1.0",
      "jsonwebtoken": "^9.0.2",
      "mysql2": "^3.14.0",
      "zod": "^3.24.2"
    },
    devDependencies: {
      "nodemon": "^3.1.9"
    }
  };
  await fs.writeJson(path.join(rootDir, 'back/package.json'), backPackage, { spaces: 2 });

  // 3. Configurar FRONTEND (Vite + React)
  console.log(chalk.yellow('⚡ Criando Frontend com Vite...'));
  await execa('npm', ['create', 'vite@latest', 'front', '--', '--template', 'react', '--yes'], { cwd: rootDir, stdio: 'inherit' });

  const frontDir = path.join(rootDir, 'front');

  // Limpar e criar estrutura no Frontend
  await fs.emptyDir(path.join(frontDir, 'public'));
  await fs.remove(path.join(frontDir, 'src/App.css'));
  await fs.remove(path.join(frontDir, 'src/index.css'));
  await fs.emptyDir(path.join(frontDir, 'src/assets'));

  await fs.ensureDir(path.join(frontDir, 'src/Componentes'));
  await fs.ensureDir(path.join(frontDir, 'src/Paginas'));
  await fs.ensureDir(path.join(frontDir, 'src/Api'));

  // Arquivos do Frontend
  await fs.writeFile(path.join(frontDir, 'src/style.css'), '@import "tailwindcss";\n');
  await fs.writeFile(path.join(frontDir, '.env'), '');

  // Atualizar index.html para incluir style.css
  const htmlPath = path.join(frontDir, 'index.html');
  if (await fs.pathExists(htmlPath)) {
    let htmlContent = await fs.readFile(htmlPath, 'utf8');
    htmlContent = htmlContent.replace('</head>', '  <link rel="stylesheet" href="./src/style.css" />\n  </head>');
    await fs.writeFile(htmlPath, htmlContent);
  }

  // Atualizar vite.config.js
  const viteConfigPath = path.join(frontDir, 'vite.config.js');
  const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
`;
  await fs.writeFile(viteConfigPath, viteConfigContent);

  // Instalar dependências no Frontend
  console.log(chalk.yellow('📥 Instalando dependências do Frontend...'));
  await execa('npm', ['install'], { cwd: frontDir, stdio: 'inherit' });
  await execa('npm', ['install', 'axios', '@tanstack/react-query', 'react-router-dom', 'framer-motion', 'dotenv'], { cwd: frontDir, stdio: 'inherit' });
  await execa('npm', ['install', 'tailwindcss', '@tailwindcss/vite', '@tailwindcss/postcss', 'postcss'], { cwd: frontDir, stdio: 'inherit' });

  // 4. Configurar PACKAGE.JSON RAIZ
  console.log(chalk.yellow('⚙️ Configurando raiz do projeto...'));
  const rootPackage = {
    name: projectName,
    version: "1.0.0",
    scripts: {
      "backend": "cd back && npm run dev",
      "frontend": "cd front && npm run dev",
      "dev": "concurrently \"npm run backend\" \"npm run frontend\""
    },
    devDependencies: {
      "concurrently": "^10.0.3"
    }
  };
  await fs.writeJson(path.join(rootDir, 'package.json'), rootPackage, { spaces: 2 });

  // Instalar dependências no Backend e Raiz
  console.log(chalk.yellow('📥 Instalando dependências do Backend e Raiz...'));
  await execa('npm', ['install'], { cwd: path.join(rootDir, 'back'), stdio: 'inherit' });
  await execa('npm', ['install'], { cwd: rootDir, stdio: 'inherit' });

  // Mensagem Final
  console.log(chalk.green('\n================================='));
  console.log(chalk.green('Projeto criado com sucesso!'));
  console.log(chalk.green('=================================\n'));
  console.log(`Para iniciar, execute:\n`);
  console.log(chalk.cyan(`  cd ${projectName}`));
  console.log(chalk.cyan(`  npm run dev\n`));
}

setup().catch((err) => {
  console.error(chalk.red('❌ Erro ao criar o projeto:'), err);
});