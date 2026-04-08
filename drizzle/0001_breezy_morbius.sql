CREATE TABLE `alertas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('exame_vencido','exame_vencer','pendencia','novo_colaborador') NOT NULL,
	`titulo` varchar(256) NOT NULL,
	`descricao` text,
	`empresaId` int,
	`colaboradorId` int,
	`exameId` int,
	`lido` boolean NOT NULL DEFAULT false,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `colaboradores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(256) NOT NULL,
	`cpf` varchar(14),
	`cargo` varchar(128),
	`setor` varchar(128),
	`empresaId` int NOT NULL,
	`status` enum('ativo','inativo','afastado') NOT NULL DEFAULT 'ativo',
	`dataNascimento` varchar(10),
	`dataAdmissao` varchar(10),
	`email` varchar(320),
	`telefone` varchar(20),
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `colaboradores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `empresas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(256) NOT NULL,
	`cnpj` varchar(18) NOT NULL,
	`responsavel` varchar(128),
	`telefone` varchar(20),
	`email` varchar(320),
	`endereco` text,
	`setor` varchar(128),
	`status` enum('ativa','inativa','pendente','atencao') NOT NULL DEFAULT 'ativa',
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `empresas_id` PRIMARY KEY(`id`),
	CONSTRAINT `empresas_cnpj_unique` UNIQUE(`cnpj`)
);
--> statement-breakpoint
CREATE TABLE `exames` (
	`id` int AUTO_INCREMENT NOT NULL,
	`colaboradorId` int NOT NULL,
	`empresaId` int NOT NULL,
	`tipo` enum('audiometria_ocupacional','avaliacao_audiologica','meatoscopia','imitanciometria') NOT NULL DEFAULT 'audiometria_ocupacional',
	`dataRealizacao` varchar(10) NOT NULL,
	`dataVencimento` varchar(10),
	`resultado` enum('normal','alteracao','perda_leve','perda_moderada','perda_severa') DEFAULT 'normal',
	`status` enum('realizado','pendente','vencido','agendado') NOT NULL DEFAULT 'realizado',
	`observacoes` text,
	`dadosAudiometria` json,
	`laudoUrl` text,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exames_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `specialty` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `crfa` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);