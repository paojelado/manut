# Manut — Gestão Operacional de Manutenção

Protótipo interativo de um produto para coordenar ordens de manutenção, equipes de campo, CDM, encarregados e almoxarifado em um único fluxo operacional.

[Abrir demonstração](https://paojelado.github.io/manut/)

## O desafio

Ordens de manutenção costumam depender de mensagens paralelas, planilhas e atualizações manuais. Isso dificulta saber quem está responsável, por que uma atividade parou e qual é a próxima decisão necessária.

O Manut organiza essas relações sem automatizar decisões técnicas. O sistema atualiza estados, registra eventos e conecta os setores; as decisões continuam com as pessoas responsáveis pela operação.

## Decisões de produto

- Histórico pessoal mostra somente as OMs em que o profissional foi o responsável designado.
- CDM acompanha solicitações, andamento, espera, exceções e conclusões de toda a operação.
- Encarregado acompanha equipe, carga de trabalho, materiais do setor e alertas.
- Almoxarifado atualiza disponibilidade e libera atividades sem depender de recados.
- Homem-hora é separado por pessoa, inclusive quando parte da equipe busca material.
- O fluxo continua utilizável sem conexão e sincroniza os registros posteriormente.

## Perfis da demonstração

- Profissional
- CDM
- Encarregado
- Almoxarifado

## Privacidade

Todos os nomes, identificações, unidades, ordens e eventos exibidos são fictícios ou anonimizados. O repositório não contém dados operacionais reais nem informações pessoais de profissionais.

## Tecnologias

- React
- TypeScript
- Vite
- GitHub Pages

## Executar localmente

```bash
npm install
npm run dev
```

## Status

Projeto conceitual de portfólio. A interface é funcional para exploração dos fluxos, mas não está conectada a uma base operacional real.
