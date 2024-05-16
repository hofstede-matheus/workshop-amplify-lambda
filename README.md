# workshop-amplify-lambda - Como subir projetos e criar portfólio

## AWS

Provedor de nuvem da Amazon. A ideia é simplificar e abstrair o jeito de colocar aplicações no ar, através de vários serviços.

Outras alternativas são Google Cloud, Microsoft Azure e outros menores.

## AWS Free Tier

Possibilidade de utilizar serviços gratuitamente, dado certas condições
Tipos

- Testes Gratuitos - Acesso gratuito por tempo limitado a serviços específicos.
- 12 Meses Gratuitos - Acesso gratuito a diversos serviços por 12 meses a partir da data de inscrição na AWS.
- Sempre Gratuito - Acesso gratuito a determinados serviços sem limite de tempo, desde que o uso permaneça dentro dos limites estabelecidos.

#### Cuidado!

Fique atento nos limites definidos no free tier.

Eu esqueci uma Task do ECS rodando e fui cobrado 100 reais no final do mês.

Dica: coloque um cartão virtual temporário e se for um erro, dá pra pedir isenção no suporte.

https://aws.amazon.com/free/

## AWS Amplify

Ferramentas e serviços desenvolvidos para simplificar a criação e implantação de aplicativos full-stack, web e mobile.

Eu pessoalmente acho excelente para hosting de sites estáticos.

Porém pra rodar um backend, eu não achei tão simples

Prefiro rodar diretamente utilizando o serviço do Lambda

Considerado “Firebase” da AWS, mas cá entre a gente eu prefiro o Firebase da Google

#### Free tier

- Build e Deploy: 1.000 minutos de build por mês
- Armazenamento de dados: 5 GB armazenados por mês
- Transferência de dados de saída: 15 GB oferecidos por mês

## AWS Lambda

Execução de código sem a necessidade de gerenciar a infraestrutura. Tem suporte a algumas linguagens de programação e a ideia é só se importar com o código.

É bom pra servir APIs simples com custo baixo.

Serverless, pague pelo tempo de execução

Funções efêmeras

FaaS - Function as a Service

Vídeo excelente pra saber como funciona por baixo dos panos

https://www.youtube.com/watch?v=f-BYvQPqOvE&ab_channel=AugustoGalego

#### Free tier

- 1.000.000 requests gratuitas por mês
- Até 3,2 milhões de segundos de tempo de computação por mês

## Mão na massa!

### O plano

- Fazer o deploy do Frontend no Amplify
- Fazer o deploy do backend no Lambda
- Automação via Github Actions
- Utilizar o Cloud watch para ver logs

### Combinados

- Esse workshop vai ser gravado
- O código está no Github
- Logo, não precisa acompanhar o que eu estou fazendo, pode atrapalhar

### Conta AWS

Bem fácil de fazer, só precisa de um cartão de crédito

Se tiver dúvidas, [tem esse vídeo no Youtube](https://www.youtube.com/watch?v=UKrYlHzcAjY) que explica bem

## Frontend

Faça um fork do repositório

https://github.com/hofstede-matheus/workshop-amplify-fe

Ou simplesmente use uma aplicação existente sua (recomendado)

No [AWS Amplify](https://us-east-1.console.aws.amazon.com/amplify/apps), crie uma nova aplicação

Em deploy, selecione a opção Github

Autorize o acesso ao repositório que está a aplicação

Configure a build com:

- Frontend build command → `npm run build`
- Build output directory → `dist`
- Se precisar de envs, configure em Advanced settings

Clique em Save and Deploy

O primeiro deploy demora mais um pouco. Depois disso, a cada push na main é feito um deploy da nova versão

Clique em Visit deployed URL para ver a aplicação no ar

## Backend

Um pouco mais complicado comparado com o frontend

Nesse caso vamos utilizar o Github actions para automatizar a atualização das Lambda Functions

Faça um fork do repositório

https://github.com/hofstede-matheus/workshop-amplify-be

Ou simplesmente utilize uma API que utiliza um express

#### Um detalhe importante

Em uma API padrão express se usa o:

```javascript
app.listen(PORT, () => {});
```

E o terminal fica travado e o processo fica esperando por requests na porta especificada

Já que uma Lambda é serverless, o processo fica “vivo” até a request retornar uma resposta.

Dessa maneira, ao invés de servir a API utilizando a maneira padrão , vamos envolver a aplicação express em uma função que retorna um handler para a Lambda

```javascript
module.exports.handler = serverless(app);
```

### Crie uma Function

Em configuração avançada, selecione:

- Enable function URL → Auth type NONE - Pra a aplicação ser acessível publicamente via HTTPS
- Configure cross-origin resource sharing (CORS) - Para permitir que seja utilizada de qualquer origem

Teste a função exemplo fornecida

Agora vamos configurar a GitHub Action para atualizar esse código toda vez que um push na master for feito

Sim, poderia ser criado no AWS Amplify, mas a ideia é mostrar como fazer isso manualmente

E pra falar a verdade eu achei mais fácil fazer manualmente...

## Github Actions

Observe essa definição de workflow

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy_lambda:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "12"
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: npm install
        env:
          CI: true
        run: |
          npm ci
      - name: deploy
        run: |
          zip -r deploy.zip ./*
          aws lambda update-function-code --function-name=backend_api --zip-file=fileb://deploy.zip
```

Um workflow é uma receita que vai ser executada toda vez que algo acontecer

Algo acontecer = push na main

Receita = Instalar o node, configurar as credenciais da AWS, instalar as dependências, zipar o código e atualizar a função lambda

Perceba que o workflow precisa de 2 secrets, AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY

Pra obter essas 2 keys, deve ser criada uma conta IAM com permissão de atualizar lambdas

## IAM (Identity and Access Management)

É um serviço que ajuda a controlar o acesso a recursos da AWS

Vai ser necessário para criar credenciais para o Github Actions ter permissão

- Vá em Users -> Create user
- Dê um nome
- Attach policies directly
- AWSLambda_FullAccess \*

\* A recomendação da AWS é que sejam criadas policies mais restritas, mas para fins de workshop, vamos utilizar a policy mais aberta

- Escolha o usuário recentemente criado
- Vá em Security Credentials
- Command Line Interface (CLI)
- Copie e cole a Access Key e Secret Access Key, elas não são mostradas novamente

## Github Secrets

Vá no repositório do Github

Settings -> Security -> Secrets and variables -> New repository secret

Adicionem as 2 secrets como AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY

## De volta ao workflow

Ceritifique-se que o workflow está na pasta .github/workflows

E que `--function-name` é o mesmo nome da função lambda

Agora que as credenciais estão configuradas, o workflow vai rodar toda vez que um push na main for feito

## Cloud Watch

Na aba de monitoramento do Lambda, é possível ver informações da função

Clicando em View CloudWatch logs, é possível ver logs de execução

Cada log representa uma execução da função

## Envirorment Variables

Na aba de configuração da função, é possível adicionar variáveis de ambiente

Vá em Edit environment variables

Adicione uma key e um value

## Conclusão

Até esse momento o frontend e a API não fazem nada

A ideia é que vocês utilizem seus projetos para testar o deploy

Nos próximos capítulos vou mostrar como

- Conectar o frontend com o backend
- Conectar um banco de dados
- Conectar a um serviço de storage
