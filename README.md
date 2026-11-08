# Can Games API

API REST acadêmica da loja fictícia **Can Games**, desenvolvida em JavaScript com Node.js e Express. A aplicação integra as APIs da CheapShark e da Steam Store para obter informações sobre jogos, preços, descontos e outros dados.

Os dados dos usuários e das funcionalidades da loja são armazenados temporariamente em memória, sem utilização de banco de dados.

---

## Requisitos

Antes de executar o projeto, certifique-se de possuir:

- **Node.js:** versão 20 ou superior.
- **npm:** gerenciador de pacotes do Node.js.
- **Conexão com a internet:** necessária para consultar as APIs da CheapShark e da Steam Store.

---

## Instalação e execução

### 1. Obter o projeto

Clone o repositório ou baixe os arquivos e acesse a pasta da API:

```bash
git clone https://github.com/Ana72Lu/can-api.git
cd can-api
```

### 2. Instalar as dependências

Execute:

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo chamado `.env` na raiz do projeto, no mesmo nível do `package.json`.

Utilize a configuração abaixo como referência:

```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=7d
CHEAPSHARK_BASE_URL=https://www.cheapshark.com/api/1.0
STEAM_STORE_BASE_URL=https://store.steampowered.com/api
CHEAPSHARK_USER_AGENT=CanGamesAPI/1.0 (academic project)
```

Os valores apresentados são exemplos para configuração local. Antes de executar a API, gere um segredo próprio para o `JWT_SECRET`, conforme explicado a seguir.

### 4. Gerar o JWT_SECRET

O `JWT_SECRET` é uma chave privada utilizada pela API para assinar e verificar os tokens JWT durante a autenticação dos usuários.

Para gerar um segredo aleatório e seguro, utilize o próprio Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

O comando gera uma sequência hexadecimal aleatória de 128 caracteres. Copie o resultado e substitua o valor de `JWT_SECRET` no arquivo `.env`:

```env
JWT_SECRET=COLE_AQUI_O_SEGREDO_GERADO
```

**Importante:**

- Não utilize o valor de exemplo apresentado na configuração como segredo definitivo.
- Não compartilhe o `JWT_SECRET` nem o publique no GitHub.
- O arquivo `.env` deve permanecer fora do controle de versão.
- Em produção, utilize um segredo próprio e diferente daquele utilizado nos testes locais.

### 5. Executar a API

Para iniciar o servidor em modo de desenvolvimento:

```bash
npm run dev
```

O Nodemon monitora as alterações nos arquivos e reinicia automaticamente o servidor quando necessário.

Para iniciar em modo normal, sem reinicialização automática:

```bash
npm start
```

Por padrão, a API estará disponível em:

```text
http://localhost:4000
```

Para verificar se o servidor está funcionando, acesse:

```text
http://localhost:4000/health
```

Se estiver tudo correto, a rota retornará uma resposta indicando que a API está operacional.

---

## Variáveis de ambiente

As configurações do projeto são definidas no arquivo `.env`, criado manualmente na raiz da aplicação.

| Variável | Valor de exemplo | Descrição |
|---|---|---|
| `PORT` | `4000` | Porta utilizada pelo servidor HTTP. |
| `NODE_ENV` | `development` | Ambiente de execução da aplicação. |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Origem autorizada para requisições do frontend. Aceita múltiplas origens separadas por vírgula. |
| `JWT_SECRET` | Deve ser configurado | Segredo utilizado para assinatura e verificação dos tokens JWT. |
| `JWT_EXPIRES_IN` | `7d` | Tempo de validade dos tokens JWT. |
| `CHEAPSHARK_BASE_URL` | `https://www.cheapshark.com/api/1.0` | URL-base da API CheapShark. |
| `STEAM_STORE_BASE_URL` | `https://store.steampowered.com/api` | URL-base da Steam Store API. |
| `CHEAPSHARK_USER_AGENT` | `CanGamesAPI/1.0 (academic project)` | Identificação utilizada nas requisições à CheapShark. |

---

## Estrutura do projeto

A aplicação utiliza uma arquitetura organizada em camadas, separando as responsabilidades de configuração, rotas, controladores, regras de negócio e armazenamento.

```text
can-api/
├── src/
│   ├── config/          # Configurações e variáveis de ambiente
│   ├── controllers/     # Tratamento das requisições e respostas HTTP
│   ├── middlewares/     # Autenticação, validação e tratamento de erros
│   ├── models/          # Entidades e armazenamento em memória
│   ├── routes/          # Definição dos endpoints
│   ├── services/        # Regras de negócio e integrações externas
│   ├── utils/           # Funções auxiliares e erros HTTP
│   ├── app.js           # Configuração da aplicação Express
│   ├── data.js          # Dados iniciais, quando aplicável
│   └── server.js        # Inicialização do servidor
├── tests/
    └── app.test.js      # Testes automatizados
```

---

## Autenticação

A autenticação utiliza **JWT (JSON Web Token)**, com tokens assinados por meio do segredo definido em `JWT_SECRET`.

Após realizar o login, a API retorna um token que deve ser enviado no cabeçalho `Authorization` das requisições que exigem autenticação.

Formato:

```http
Authorization: Bearer <token>
```

No Postman, selecione a opção **Authorization**, escolha o tipo **Bearer Token** e informe o token recebido no login.

As rotas protegidas são identificadas nas tabelas de endpoints.

---

## Endpoints

Todas as rotas da API utilizam o prefixo `/api`, exceto `/health`.

URL-base:

```text
http://localhost:4000/api
```

### Health Check

Verifica se o servidor está funcionando.

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| GET | `/health` | Não | Verifica a disponibilidade da API. |

Exemplo:

```http
GET http://localhost:4000/health
```

### Jogos

As rotas de jogos integram informações da CheapShark e da Steam Store.

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| GET | `/games` | Não | Lista jogos e ofertas disponíveis. |
| GET | `/games/:identifier` | Não | Consulta os detalhes de um jogo pelo Steam App ID ou identificador textual. |

**Parâmetros de consulta de `GET /games`:**

| Parâmetro | Descrição |
|---|---|
| `page` | Página dos resultados. |
| `limit` | Quantidade de jogos por página. |
| `search` | Pesquisa jogos pelo nome. |
| `onSale` | Filtra jogos em promoção (`true` ou `false`). |
| `genre` | Filtra jogos por gênero. |
| `sort` | Define a ordenação dos resultados. |

Exemplo:

```http
GET /api/games?page=0&limit=24&onSale=true
```

Pesquisa:

```http
GET /api/games?search=counter
```

Filtro por gênero:

```http
GET /api/games?genre=action
```

Consulta dos detalhes de um jogo:

```http
GET /api/games/570
```

A listagem retorna dados normalizados para utilização pelo frontend, incluindo identificador, título, descrição, desenvolvedor, data de lançamento, gêneros, imagens, preço, desconto, tags e resumo das avaliações, além de informações auxiliares.

O objeto de preço mantém os valores decimais e a identificação da moeda:

```json
{
  "current": 59.99,
  "original": 99.99,
  "currency": "BRL",
  "discountPercent": 40,
  "isOnSale": true
}
```

Os campos `current` e `original` representam valores na unidade da moeda informada em `currency`. Não são valores inteiros em centavos.

O campo `priceInCents`, quando disponível, representa o preço em centavos de BRL. Quando a fonte fornece apenas um preço em outra moeda, o campo permanece `null`, evitando conversões cambiais não realizadas pela aplicação. Jogos gratuitos retornam `0`.

Os campos `unitsSold` e `isFeatured` são informações locais, pois as fontes externas não disponibilizam esses dados.

A rota individual acrescenta informações como descrições, capturas de tela, plataformas, idiomas, recursos, requisitos mínimos e recomendados e metadados de classificação etária.

A classificação indicativa brasileira (`ageRating`) permanece `null` quando não há informação correspondente. A classificação etária da Steam não é equivalente à classificação brasileira, por isso seus descritores são preservados separadamente em `ageRatingSteam`.

### Carrinho

Gerencia os jogos adicionados ao carrinho.

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| GET | `/cart` | Não | Consulta os itens do carrinho. |
| POST | `/cart` | Não | Adiciona um jogo ao carrinho. |
| DELETE | `/cart/:gameId` | Não | Remove um jogo do carrinho. |

**Adicionar jogo:**

```http
POST /api/cart
Content-Type: application/json
```

Corpo da requisição:

```json
{
  "game": {
    "id": "570",
    "title": "Dota 2",
    "priceInCents": 0,
    "price": {
      "current": 0,
      "currency": "BRL"
    }
  }
}
```

**Consultar carrinho:**

```http
GET /api/cart
```

**Remover jogo:**

```http
DELETE /api/cart/570
```

### Lista de desejos

Gerencia os jogos que o usuário deseja adquirir futuramente.

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| GET | `/wishlist` | Não | Consulta a lista de desejos. |
| POST | `/wishlist` | Não | Adiciona um jogo à lista. |
| DELETE | `/wishlist/:gameId` | Não | Remove um jogo da lista. |
| PATCH | `/wishlist/:gameId` | Não | Altera a posição de um jogo na lista. |

**Adicionar jogo:**

```http
POST /api/wishlist
Content-Type: application/json
```

O corpo segue o mesmo formato utilizado para adicionar jogos ao carrinho.

**Alterar posição:**

```http
PATCH /api/wishlist/570
Content-Type: application/json
```

```json
{
  "position": 0
}
```

**Remover jogo:**

```http
DELETE /api/wishlist/570
```

### Biblioteca

Consulta e atualiza os jogos adquiridos pelo usuário.

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| GET | `/library` | Sim | Consulta os jogos da biblioteca. |
| PATCH | `/library/:gameId` | Sim | Atualiza a data da última execução do jogo (`lastPlayedAt`). |

**Consultar biblioteca:**

```http
GET /api/library
Authorization: Bearer <token>
```

**Registrar execução:**

```http
PATCH /api/library/570
Authorization: Bearer <token>
```

A biblioteca possui uma regra de negócio específica: jogos só podem ser adicionados após a finalização de uma compra aprovada.

Por esse motivo, a API não disponibiliza `POST /library` nem `DELETE /library/:gameId`. A inclusão ocorre exclusivamente pelo serviço de pedidos, e os jogos não podem ser removidos diretamente da biblioteca.

As respostas das coleções seguem a estrutura:

```json
{
  "gameId": "570",
  "addedAt": "2026-11-08T12:00:00.000Z",
  "lastPlayedAt": null
}
```

O objeto completo do jogo é mantido internamente para processamento dos pedidos e gerenciamento das coleções.

### Usuários

Gerencia o cadastro, a consulta, a atualização e a exclusão de contas.

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/users` | Não | Cadastra um novo usuário. |
| GET | `/users/me` | Sim | Consulta o perfil do usuário autenticado. |
| PATCH | `/users/:id` | Sim | Atualiza os dados do próprio perfil. |
| DELETE | `/users/:id` | Sim | Exclui a própria conta e seus dados associados. |

**Cadastrar usuário:**

```http
POST /api/users
Content-Type: application/json
```

```json
{
  "fullName": "Usuário de Teste",
  "nickname": "teste123",
  "birthDate": "2000-01-15",
  "address": "Rua de Teste, 123",
  "email": "teste@exemplo.com",
  "password": "CanGames123"
}
```

Todos os campos são obrigatórios. A senha deve possuir pelo menos oito caracteres, incluindo letras e números. O cadastro também valida os demais dados informados.

**Consultar perfil:**

```http
GET /api/users/me
Authorization: Bearer <token>
```

**Atualizar perfil:**

```http
PATCH /api/users/ID_DO_USUARIO
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "fullName": "Usuário Atualizado",
  "nickname": "novoapelido",
  "address": "Nova Rua, 456",
  "email": "novoemail@exemplo.com"
}
```

**Excluir conta:**

```http
DELETE /api/users/ID_DO_USUARIO
Authorization: Bearer <token>
```

A exclusão remove os dados associados à conta armazenados na aplicação.

### Sessões

Gerencia a autenticação e o encerramento de sessões.

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/sessions` | Não | Realiza o login e retorna o token JWT. |
| DELETE | `/sessions` | Sim | Encerra a sessão autenticada. |

**Login:**

```http
POST /api/sessions
Content-Type: application/json
```

```json
{
  "email": "teste@exemplo.com",
  "password": "CanGames123"
}
```

A resposta contém o token JWT e os dados públicos do usuário:

```json
{
  "data": {
    "token": "<token>",
    "user": {
      "id": "uuid",
      "fullName": "Usuário de Teste",
      "nickname": "teste123",
      "email": "teste@exemplo.com"
    }
  }
}
```

**Logout:**

```http
DELETE /api/sessions
Authorization: Bearer <token>
```

O logout encerra a sessão e retorna o status HTTP `204 No Content`.

### Pedidos

Gerencia a consulta e a finalização de compras.

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| GET | `/orders` | Sim | Consulta os pedidos do usuário autenticado. |
| POST | `/orders` | Sim | Finaliza a compra simulada dos jogos do carrinho. |

**Finalizar compra:**

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json
```

Corpo da requisição:

```json
{
  "gameIds": ["570"],
  "paymentMethod": "pix"
}
```

Os métodos de pagamento aceitos são:

- `credit-card`
- `debit-card`
- `boleto`
- `pix`
- `bank-deposit`

A API verifica se os identificadores enviados correspondem exatamente aos jogos presentes no carrinho e valida o método de pagamento.

Após a validação, a compra é aprovada de maneira simulada e as seguintes operações são realizadas:

1. O pedido é criado com um identificador no formato `CAN-XXXXXX`.
2. O valor total é calculado a partir dos preços em centavos de BRL.
3. Os jogos adquiridos são adicionados à biblioteca.
4. Os jogos comprados são removidos da lista de desejos.
5. O carrinho é esvaziado.

A resposta inclui os identificadores dos jogos, o método de pagamento, o código do pedido e a data de criação, além dos metadados do pedido.

**Consultar pedidos:**

```http
GET /api/orders
Authorization: Bearer <token>
```

**Importante:** o processo de pagamento é inteiramente simulado para fins acadêmicos. Nenhuma transação financeira real é realizada.

---

## Testes e qualidade de código

O projeto utiliza Jest e Supertest para executar testes automatizados.

Para executar os testes:

```bash
npm test
```

Para executar os testes em modo de observação:

```bash
npm run test:watch
```

**Importante:** os testes automatizados implementados não abrangem todas as rotas e funcionalidades da API. Eles verificam apenas os cenários contemplados no arquivo `tests/app.test.js`. Portanto, a execução de `npm test` não representa uma validação completa de todos os endpoints.

As rotas e funcionalidades que não possuem cobertura automatizada devem ser verificadas manualmente, utilizando ferramentas como [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/).

Outros comandos disponíveis:

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor com Nodemon. |
| `npm start` | Inicia o servidor sem reinicialização automática. |
| `npm run lint` | Verifica problemas no código com ESLint. |
| `npm run lint:fix` | Corrige automaticamente problemas corrigíveis pelo ESLint. |
| `npm run format` | Formata os arquivos com Prettier. |
| `npm run format:check` | Verifica a formatação sem modificar os arquivos. |
| `npm test` | Executa os testes automatizados implementados. |
| `npm run test:watch` | Executa os testes em modo de observação. |

---

## Armazenamento e limitações

A API foi desenvolvida para fins acadêmicos e possui algumas limitações:

- **Sem banco de dados:** não utiliza banco de dados, ORM, arquivos YAML ou persistência em disco.
- **Armazenamento em memória:** usuários, sessões, carrinhos, listas de desejos, bibliotecas e pedidos são mantidos em estruturas JavaScript durante a execução.
- **Perda de dados:** reiniciar o servidor apaga os dados armazenados em memória.
- **Integrações externas:** as ofertas e os preços são obtidos da CheapShark, enquanto informações complementares dos jogos são consultadas na Steam Store.
- **Cache:** os resultados das consultas externas são armazenados temporariamente em memória para reduzir requisições.
- **Autenticação:** os tokens JWT dependem do segredo configurado e do gerenciamento de sessões em memória.
- **Pagamento simulado:** a aprovação dos pedidos não envolve um gateway de pagamento ou transações reais.
- **Dados complementares:** algumas informações específicas da loja, como destaque e unidades vendidas, são valores locais, pois não são fornecidas pelas APIs externas.