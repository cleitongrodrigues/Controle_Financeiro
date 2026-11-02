Desacoplando o login — microsserviço de autenticação
O catálogo de filmes fazia login, cadastro e controle de acesso no mesmo backend que serve o catálogo. Hoje isso vira um serviço à parte — e ganha uma funcionalidade nova: recuperação de senha por e-mail, com link que expira em 30 minutos.

Entrega sexta-feira, 28/08/2026
continuação direta da atividade 2 (catálogo de filmes)
Na atividade 2, tudo rodava num container só: o catálogo, o login, o cadastro, o controle de quem pode favoritar e comentar o quê. Funciona, mas tem um problema de design — qualquer mudança na lógica de autenticação exige mexer no mesmo código e no mesmo deploy do catálogo, mesmo que as duas coisas não tenham nada a ver uma com a outra.

Hoje o assunto é serviços desacoplados. Você vai extrair tudo que é autenticação — login, papéis de usuário, esqueci minha senha — pra um container novo, separado, que conversa com o catálogo só pela rede interna do Docker. É a mesma decisão de arquitetura por trás de qualquer sistema em produção que separa "o que muda junto" do "o que muda sozinho".

Conceito

O que é um microsserviço
Não é sobre ter "vários containers" por ter — é sobre onde você traça a fronteira de responsabilidade.

Um monólito é uma aplicação onde tudo — regras de negócio, autenticação, acesso a dados — vive no mesmo processo, no mesmo deploy. Um microsserviço é o oposto: cada responsabilidade bem definida vira um serviço independente, com seu próprio processo, seu próprio ciclo de deploy, falando com os outros serviços só por rede (uma chamada HTTP, não uma chamada de função).

A vantagem não é "ser mais moderno" — é isolamento real: o serviço de autenticação pode cair, reiniciar, ser atualizado ou escalado sem derrubar o catálogo, e vice-versa. A desvantagem é que você trocou uma chamada de função (instantânea, sempre disponível) por uma chamada de rede (pode falhar, pode demorar, precisa de tratamento de erro). Separar em microsserviços é uma troca deliberada, não é grátis — e não é sempre a escolha certa pra qualquer parte do sistema.

ATIVIDADE 2 — monólito
1 container. Catálogo, login, favoritos e comentários no mesmo código, no mesmo processo, no mesmo deploy.

ATIVIDADE 3 — desacoplado
2 containers. O catálogo continua público; a autenticação vira um serviço à parte, só acessível de dentro da rede Docker.

Requisitos

O que o microsserviço precisa ter
1
Um container novo, separado do catálogo
Crie um segundo serviço no seu docker-compose.yml — pode ser na mesma linguagem do catálogo ou outra, isso não importa pro conceito. Esse container é o serviço de autenticação: login, cadastro, papéis de usuário (role) e esqueci minha senha moram só nele. O catálogo deixa de ter essa lógica — ele passa a chamar o serviço de autenticação pra qualquer coisa relacionada a usuário.

2
Comunicação só pela rede interna do Docker
O serviço de autenticação não publica porta pro host — sem ports: mapeado pra fora no docker-compose.yml. Ele fica só na mesma rede Docker do catálogo, acessível internamente pelo nome do serviço (ex: o catálogo chama http://auth-service:3000/login, não um IP nem uma porta pública). Continua existindo só um ponto de entrada público — o catálogo, no seu subdomínio de sempre — o resto fica invisível pra internet.

3
Papéis de usuário (role)
Pelo menos dois papéis — por exemplo, usuario e admin. Não precisa de uma tela de administração completa; o importante é que o serviço de autenticação saiba responder "qual o papel desse usuário" quando o catálogo perguntar.

4
Esqueci minha senha — com expiração real
O usuário informa o e-mail, recebe um link de redefinição, e esse link para de funcionar depois de 30 minutos. Isso precisa de um registro de quando o link foi gerado, não só o link em si.

tabela reset_tokens:
  token       (aleatório, único — ex: uuid ou hash de 32+ bytes)
  usuario_id
  criado_em
  expira_em   (criado_em + 30 minutos)
  usado       (boolean, evita reusar o mesmo link duas vezes)
5
Envio real de e-mail
O link precisa chegar por e-mail de verdade, não só aparecer na tela. A escolha do serviço de envio muda dependendo do ambiente:

Desenvolvimento: Mailtrap — sandbox de e-mail gratuito, feito pra testar sem gastar cota nem arriscar mandar e-mail de verdade por engano. O e-mail nunca sai de fato, mas você vê exatamente o que seria enviado.
Produção: Brevo — serviço de envio transacional de verdade, com camada gratuita, pensado pra e-mails que precisam realmente chegar na caixa de entrada do usuário.
Pra esta atividade, o ambiente de desenvolvimento (Mailtrap) já é suficiente — a distinção é pra você já sair entendendo que a escolha do serviço de e-mail muda dependendo de onde a aplicação está rodando.

6
Validação do link
Quando o usuário clica no link e envia a nova senha, o serviço de autenticação precisa checar três coisas antes de trocar a senha: o token existe? ainda não passou de expira_em? ainda não foi usado? Qualquer uma dessas falhando, a troca é recusada e o usuário precisa pedir um link novo.

Arquitetura de referência

Dois containers, uma rede, um ponto de entrada público
Navegador
usuário final
rede docker interna
Catálogo
único ponto público
subdomínio do aluno
Serviço de autenticação
login, role, esqueci-senha
sem porta publicada
MariaDB
usuários + reset_tokens
SMTP externo
Mailtrap (dev) / Brevo (prod)
E-mail do
usuário
HTTPS
rede interna
token + expiração
envia
usuário clica no link →
O catálogo é o único container com porta pública. Tudo relacionado a login, papéis e recuperação de senha atravessa a rede interna do Docker até o serviço de autenticação — que nunca fica acessível de fora. Quando o link de recuperação chega por e-mail e o usuário clica nele, a requisição volta a entrar pelo catálogo (a linha tracejada), que repassa a validação pro serviço de autenticação internamente.
Entrega

Continuar o mesmo repositório, não criar um novo
Continue no
mesmo repositório público do GitHub
da atividade 2 (não precisa criar um novo do zero) — só adicione o novo serviço e atualize o README contando o que mudou
Continue mencionando o professor no README:
github.com/siriani
Mostre o
docker-compose.yml
com os dois serviços e a rede compartilhada entre eles
Confirme que o serviço de autenticação não tem porta publicada pro host
Demonstre o fluxo completo de esqueci-senha: pedido → e-mail recebido (print do Mailtrap) → link usado → senha trocada
Demonstre uma tentativa de usar o link
depois de 30 minutos
(ou um token inválido) sendo recusada