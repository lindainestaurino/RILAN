import { User, Role, Material, StockMovement, MovementType, MovementReason, AuditLog, Supplier, SalesForecast } from '../types';
import { GoogleGenAI, Chat, Type } from "@google/genai";

// --- RAW DATA FROM CSVs ---
// This section simulates reading the provided CSV files for initial setup.

const rawSuppliers = [
    { id: '9b030f78', name: 'Gerdau S.A', cnpj: '33611500000119', phone: '1130946600', email: 'inform@gerdau.com' },
    { id: '9cca0457', name: 'InterCement Brasil S.A', cnpj: '62258884000136', phone: '11999899003', email: 'atendimento@intercement.com' },
    { id: '1de4fb53', name: 'Aço Cearense Comercial Ltda', cnpj: '07557333000165', phone: '8540111600', email: 'atendimento@grupoacocearense.com.br' },
    { id: '610d460a', name: 'CSN Cimentos Brasil S.A', cnpj: '60869336001117', phone: '24992005623', email: 'vendas.cimentocsn@csn.com.br' },
    { id: '18342728', name: 'Leroy Merlin', cnpj: '01438784000105', phone: '40071380', email: 'atendimento@leroy.com' },
    { id: 'ba1259ff', name: 'C&C Casa e Construção', cnpj: '63004030000196', phone: '112233445566', email: 'atendimento@cc.com.br' },
    { id: '693b8924', name: 'Saint-Gobain Distribuição Brasil Ltda', cnpj: '03840986005670', phone: '1140042444', email: 'atendimento@sg.com.br' },
    { id: 'ab2c3116', name: 'Tigre S.A.', cnpj: '08862530000231', phone: '0800 70 74 700', email: 'atendimento@tigre.com' },
    { id: '91680d9f', name: 'Portobello S.A.', cnpj: '24206970000106', phone: '08006482002', email: 'atendimento@portobello.com' },
    { id: '5419c094', name: 'Dicico Home Center', cnpj: '03439316002116', phone: '11998557496', email: 'atendimento@dicico.com' },
];

const rawMaterials = [
  { id: '512f7df4', description: 'Cimento CP II / CPII F32 — Saco 50 kg | INTERCEMENT', unit: 'UN', supplierId: '9cca0457', price: '35,00' },
  { id: '5a12f1e3', description: 'Areia média lavada — preparado para argamassa | C&C', unit: 'M³', supplierId: 'ba1259ff', price: '200,00' },
  { id: '25bffe29', description: 'Brita 1 (pedra britada) — para concreto | SAINT', unit: 'M³', supplierId: '693b8924', price: '250,00' },
  { id: 'cbfbd289', description: 'Pedrisco / brita 0 (areia grossa) — uso em concreto | C&C', unit: 'M³', supplierId: 'ba1259ff', price: '180,00' },
  { id: '86573295', description: 'Vergalhão CA-50 10 mm (3/8") — barra 12 m | GERDAU', unit: 'M', supplierId: '9b030f78', price: '47,00' },
  { id: 'b79c2747', description: 'Vergalhão CA-50 12,5 mm — barra 12 m | GERDAU', unit: 'M', supplierId: '9b030f78', price: '75,00' },
  { id: '4fffdc37', description: 'Tela / malha soldada para laje | C&C', unit: 'M²', supplierId: 'ba1259ff', price: '12,00' },
  { id: 'a29e247b', description: 'Bloco de concreto 14x19x39 cm (bloco estrutural) | LEROY', unit: 'UN', supplierId: '18342728', price: '6,50' },
  { id: 'df4a691e', description: 'Tijolo cerâmico 19x19x39 (tijolo estrutural) | LEROY', unit: 'UN', supplierId: '18342728', price: '5,00' },
  { id: 'be63fdc0', description: 'Telha cerâmica (portuguesa) | SAINT', unit: 'UN', supplierId: '693b8924', price: '8,00' },
  { id: 'e18a7598', description: 'Piso cerâmico (revestimento) — porcelanato/cerâmica média | PORTO', unit: 'M²', supplierId: '91680d9f', price: '40,00' },
  { id: '842d770c', description: 'Argamassa pronta para assentamento (saco 20 kg) | SAINT', unit: 'UN', supplierId: '693b8924', price: '35,00' },
  { id: '5f9c11f6', description: 'Rejunte (saco ou bisnaga) — por kg | CSN', unit: 'KG', supplierId: '610d460a', price: '10,00' },
  { id: 'e5550c65', description: 'Tinta acrílica PVA para parede — lata 18 L | PORTO', unit: 'L', supplierId: '91680d9f', price: '220,00' },
  { id: '829031f2', description: 'Massa corrida (lata 18 L) — unidade | LEROY', unit: 'L', supplierId: '18342728', price: '220,00' },
  { id: 'd71d2cdb', description: 'Placa de drywall (gesso acartonado) 12,5 mm — 1,20 x 2,40 m | DICICO', unit: 'UN', supplierId: '5419c094', price: '55,00' },
  { id: 'dfe0fbb6', description: 'Chapisco / reboco (cimento e areia) — m² | DICICO', unit: 'M²', supplierId: '5419c094', price: '18,00' },
  { id: 'f3bb3861', description: 'Tubo PVC rígido (esgoto) 100 mm — por metro | TIGRE', unit: 'M', supplierId: 'ab2c3116', price: '18,00' },
  { id: 'c046c362', description: 'Tubo PVC hidráulico (1/2") — por metro | TIGRE', unit: 'M', supplierId: 'ab2c3116', price: '3,50' },
  { id: '334ed959', description: 'Conexões PVC (joelho, T, luva) — unidade | TIGRE', unit: 'UN', supplierId: 'ab2c3116', price: '8,00' },
  { id: 'c19d49b6', description: 'Fio / cabo elétrico 2,5 mm² (cobre) — por metro | AÇOCEARENSE', unit: 'M', supplierId: '1de4fb53', price: '3,50' },
  { id: '25f30c1c', description: 'Laje pré-moldada / vigota (peça) — unidade | LEROY', unit: 'UN', supplierId: '18342728', price: '120,00' },
  { id: '81c7e01f', description: 'Argamassa colante para revestimento (saco 20 kg) | DICICO', unit: 'UN', supplierId: '5419c094', price: '40,00' },
  { id: 'fc7b297e', description: 'Piso cimentício ou cimentado (m²) — cimentício simples | PORTO', unit: 'M²', supplierId: '91680d9f', price: '55,00' },
  { id: '276c701e', description: 'Porta de madeira interna (pronta para pintar) — unidade | C&C', unit: 'UN', supplierId: 'ba1259ff', price: '220,00' },
  { id: '4c9f87a7', description: 'Cimento CP II / CPII F32 — Saco 50 kg | CSN', unit: 'UN', supplierId: '610d460a', price: '37,00' },
  { id: '0becc068', description: 'Areia média lavada — preparado para argamassa | LEROY', unit: 'M³', supplierId: '18342728', price: '197,00' },
  { id: '90ded218', description: 'Brita 1 (pedra britada) — para concreto | PORTO', unit: 'M³', supplierId: '91680d9f', price: '247,00' },
  { id: '52dc4502', description: 'Pedrisco / brita 0 (areia grossa) — uso em concreto | DICICO', unit: 'M³', supplierId: '5419c094', price: '175,00' },
  { id: 'dd7442c3', description: 'Vergalhão CA-50 10 mm (3/8") — barra 12 m | AÇOCEARENSE', unit: 'M', supplierId: '1de4fb53', price: '52,00' },
  { id: '3665836c', description: 'Vergalhão CA-50 12,5 mm — barra 12 m | AÇOCEARENSE', unit: 'M', supplierId: '1de4fb53', price: '77,00' },
  { id: 'bf9ad9d0', description: 'Tela / malha soldada para laje | LEROY', unit: 'M²', supplierId: '18342728', price: '15,00' },
  { id: 'fea74349', description: 'Bloco de concreto 14x19x39 cm (bloco estrutural) | SAINT', unit: 'UN', supplierId: '693b8924', price: '8,00' },
  { id: '61afd127', description: 'Tijolo cerâmico 19x19x39 (tijolo estrutural) | C&C', unit: 'UN', supplierId: 'ba1259ff', price: '4,50' },
  { id: '2520a55d', description: 'Telha cerâmica (portuguesa) | DICICO', unit: 'UN', supplierId: '5419c094', price: '6,00' },
  { id: '71b256e6', description: 'Piso cerâmico (revestimento) — porcelanato/cerâmica média | C&C', unit: 'M²', supplierId: 'ba1259ff', price: '42,00' },
  { id: 'fae2801b', description: 'Argamassa pronta para assentamento (saco 20 kg) | LEROY', unit: 'UN', supplierId: '18342728', price: '32,00' },
  { id: '7f5b3057', description: 'Tinta acrílica PVA para parede — lata 18 L | C&C', unit: 'L', supplierId: 'ba1259ff', price: '247,00' },
  { id: '810a19f7', description: 'Massa corrida (lata 18 L) — unidade | SAINT', unit: 'L', supplierId: '693b8924', price: '235,00' },
  { id: '607a552e', description: 'Placa de drywall (gesso acartonado) 12,5 mm — 1,20 x 2,40 m | PORTO', unit: 'UN', supplierId: '91680d9f', price: '50,00' },
  { id: '73e9c262', description: 'Chapisco / reboco (cimento e areia) — m² | SAINT', unit: 'M²', supplierId: '693b8924', price: '15,00' },
  { id: '90b62878', description: 'Tubo PVC rígido (esgoto) 100 mm — por metro | SAINT', unit: 'M', supplierId: '693b8924', price: '22,00' },
  { id: '2aa77a33', description: 'Tubo PVC hidráulico (1/2") — por metro | C&C', unit: 'M', supplierId: 'ba1259ff', price: '4,00' },
  { id: '73fe7d02', description: 'Conexões PVC (joelho, T, luva) — unidade | LEROY', unit: 'UN', supplierId: '18342728', price: '7,00' },
  { id: 'c547e739', description: 'Fio / cabo elétrico 2,5 mm² (cobre) — por metro | C&C', unit: 'M', supplierId: 'ba1259ff', price: '3,25' },
  { id: '71bfe3d8', description: 'Laje pré-moldada / vigota (peça) — unidade | DICICO', unit: 'UN', supplierId: '5419c094', price: '115,00' },
  { id: 'a1ed7a52', description: 'Argamassa colante para revestimento (saco 20 kg) | PORTO', unit: 'UN', supplierId: '91680d9f', price: '37,00' },
  { id: '9a9ba827', description: 'Piso cimentício ou cimentado (m²) — cimentício simples | SAINT', unit: 'M²', supplierId: '693b8924', price: '52,00' },
  { id: '666fc850', description: 'Porta de madeira interna (pronta para pintar) — unidade | LEROY', unit: 'UN', supplierId: '18342728', price: '275,00' },
  { id: '0f14e9e6', description: 'Rejunte (saco ou bisnaga) — por kg | INTERCEMENT', unit: 'KG', supplierId: '9cca0457', price: '7,00' },
];

const rawMovements = [
  { resp: 'lindainestaurino@gmail.com', id: '4a55e9e0', date: '9/30/25 13:43', type: 'FALSE', materialId: '829031f2', nf: '12345', qty: '100,00', location: "-20.311897, -40.292467" },
  { resp: 'lindainestaurino@gmail.com', id: '7037b5f4', date: '9/30/25 14:00', type: 'TRUE', materialId: '829031f2', nf: '654987', qty: '25,00', location: "-20.311897, -40.292467" },
  { resp: 'lindainestaurino@gmail.com', id: '0f53738f', date: '9/30/25 14:09', type: 'FALSE', materialId: '86573295', nf: '654231', qty: '1000,00', location: "-20.311897, -40.292456" },
  { resp: 'lindainestaurino@gmail.com', id: 'ff777060', date: '9/30/25 20:30', type: 'FALSE', materialId: 'a29e247b', nf: '987543', qty: '100,00', location: "-20.277094, -40.326622" },
  { resp: 'lindainestaurino@gmail.com', id: '91e73aa3', date: '9/26/25 17:43', type: 'FALSE', materialId: '86573295', nf: '643679', qty: '300,00', location: "-20.277067, -40.326652" },
  { resp: 'lindainestaurino@gmail.com', id: 'bb052aba', date: '9/28/25 20:50', type: 'FALSE', materialId: 'b79c2747', nf: '135796', qty: '300,00', location: "-20.277273, -40.326607" },
  { resp: 'lindainestaurino@gmail.com', id: '33e21b27', date: '9/30/25 20:51', type: 'TRUE', materialId: '86573295', nf: '976590', qty: '25,00', location: "-20.277260, -40.326598" },
  { resp: 'lindainestaurino@gmail.com', id: '8fc183c8', date: '9/30/25 20:51', type: 'TRUE', materialId: 'b79c2747', nf: '654479', qty: '33,00', location: "-20.277260, -40.326598" },
  { resp: 'lindainestaurino@gmail.com', id: '962f131d', date: '9/24/25 20:52', type: 'FALSE', materialId: 'c19d49b6', nf: '764790', qty: '300,00', location: "-20.277168, -40.326610" },
  { resp: 'lindainestaurino@gmail.com', id: '2cec0144', date: '9/30/25 20:53', type: 'TRUE', materialId: 'c19d49b6', nf: '752469', qty: '77,00', location: "-20.277145, -40.326599" },
  { resp: 'lindainestaurino@gmail.com', id: '0ca2ec7f', date: '9/24/25 20:54', type: 'FALSE', materialId: 'dd7442c3', nf: '325699', qty: '177,00', location: "-20.277145, -40.326598" },
  { resp: 'lindainestaurino@gmail.com', id: '3eb3a5d0', date: '9/30/25 20:55', type: 'TRUE', materialId: 'dd7442c3', nf: '435790', qty: '68,00', location: "-20.277145, -40.326598" },
  { resp: 'lindainestaurino@gmail.com', id: '2bde1c8d', date: '9/25/25 20:56', type: 'FALSE', materialId: '3665836c', nf: '764580', qty: '300,00', location: "-20.277169, -40.326647" },
  { resp: 'lindainestaurino@gmail.com', id: 'e4c5819c', date: '9/30/25 20:57', type: 'TRUE', materialId: '3665836c', nf: '764589', qty: '98,00', location: "-20.277173, -40.326643" },
  { resp: 'lindainestaurino@gmail.com', id: '5e29eeda', date: '9/24/25 20:59', type: 'FALSE', materialId: 'c19d49b6', nf: '65347', qty: '30,00', location: "-20.277136, -40.326618" },
  { resp: 'lindainestaurino@gmail.com', id: '9fe72c67', date: '9/24/25 21:00', type: 'FALSE', materialId: 'f3bb3861', nf: '988754', qty: '300,00', location: "-20.277220, -40.326575" },
  { resp: 'lindainestaurino@gmail.com', id: '804b362f', date: '9/23/25 21:01', type: 'FALSE', materialId: 'c046c362', nf: '098654', qty: '258,00', location: "-20.277174, -40.326608" },
  { resp: 'lindainestaurino@gmail.com', id: 'e51fb4ff', date: '9/30/25 21:02', type: 'FALSE', materialId: '334ed959', nf: '997654', qty: '600,00', location: "-20.277168, -40.326593" },
  { resp: 'lindainestaurino@gmail.com', id: 'eff0c594', date: '9/21/25 21:05', type: 'FALSE', materialId: '334ed959', nf: '799645', qty: '366,00', location: "-20.277168, -40.326593" },
  { resp: 'lindainestaurino@gmail.com', id: '99011426', date: '9/30/25 21:05', type: 'TRUE', materialId: '334ed959', nf: '688545', qty: '68,00', location: "-20.277168, -40.326593" },
  { resp: 'lindainestaurino@gmail.com', id: '1ec1d317', date: '9/30/25 21:06', type: 'TRUE', materialId: 'c046c362', nf: '864589', qty: '60,00', location: "-20.277168, -40.326593" },
  { resp: 'lindainestaurino@gmail.com', id: 'e4aa9b26', date: '9/30/25 21:09', type: 'TRUE', materialId: 'f3bb3861', nf: '754588', qty: '68,00', location: "-20.277078, -40.326640" },
  { resp: 'arthursouzacabral187@gmail.com', id: '944e4a33', date: '9/30/25 21:25', type: 'FALSE', materialId: 'a29e247b', nf: '501115', qty: '250,00', location: "-20.312770, -40.393440" },
  { resp: 'arthursouzacabral187@gmail.com', id: '703220ac', date: '9/30/25 21:33', type: 'FALSE', materialId: 'df4a691e', nf: '981125', qty: '155,00', location: "-20.312792, -40.393462" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'e19cb92a', date: '9/30/25 21:34', type: 'FALSE', materialId: '829031f2', nf: '315012', qty: '80,00', location: "-20.312789, -40.393461" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'b5f85142', date: '9/30/25 21:35', type: 'FALSE', materialId: '25f30c1c', nf: '418003', qty: '220,00', location: "-20.312791, -40.393459" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'a3c220ed', date: '9/30/25 21:36', type: 'FALSE', materialId: '0becc068', nf: '355022', qty: '175,00', location: "-20.312794, -40.393461" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'e854d440', date: '9/30/25 21:38', type: 'FALSE', materialId: 'bf9ad9d0', nf: '031251', qty: '310,00', location: "-20.312791, -40.393459" },
  { resp: 'arthursouzacabral187@gmail.com', id: '2f2636de', date: '9/30/25 21:39', type: 'FALSE', materialId: 'fae2801b', nf: '512252', qty: '15,00', location: "-20.312795, -40.393464" },
  { resp: 'arthursouzacabral187@gmail.com', id: '30852783', date: '9/30/25 21:40', type: 'FALSE', materialId: '73fe7d02', nf: '235151', qty: '50,00', location: "-20.312797, -40.393455" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'fa9988f3', date: '9/30/25 21:41', type: 'FALSE', materialId: '666fc850', nf: '723212', qty: '7,00', location: "-20.312790, -40.393478" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'f28ff9f7', date: '9/30/25 21:42', type: 'FALSE', materialId: '5a12f1e3', nf: '523140', qty: '40,00', location: "-20.312790, -40.393473" },
  { resp: 'arthursouzacabral187@gmail.com', id: '775f4757', date: '9/30/25 21:43', type: 'FALSE', materialId: 'cbfbd289', nf: '771595', qty: '125,00', location: "-20.312748, -40.393431" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'f09c14ec', date: '9/30/25 21:44', type: 'FALSE', materialId: '4fffdc37', nf: '309714', qty: '205,00', location: "-20.312748, -40.393431" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'ba57a506', date: '9/30/25 21:45', type: 'FALSE', materialId: '276c701e', nf: '094269', qty: '8,00', location: "-20.312748, -40.393431" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'ce11f4c9', date: '9/30/25 21:46', type: 'TRUE', materialId: '61afd127', nf: '549660', qty: '380,00', location: "-20.312763, -40.393439" },
  { resp: 'arthursouzacabral187@gmail.com', id: '7716bf80', date: '9/30/25 21:47', type: 'TRUE', materialId: '71b256e6', nf: '301777', qty: '340,00', location: "-20.312786, -40.393462" },
  { resp: 'arthursouzacabral187@gmail.com', id: '4dd66803', date: '9/30/25 21:48', type: 'FALSE', materialId: '7f5b3057', nf: '972841', qty: '17,00', location: "-20.312786, -40.393462" },
  { resp: 'arthursouzacabral187@gmail.com', id: '73ec9504', date: '9/30/25 21:49', type: 'FALSE', materialId: '2aa77a33', nf: '996421', qty: '93,00', location: "-20.312785, -40.393461" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'f3bbf8fd', date: '9/30/25 21:50', type: 'TRUE', materialId: 'c547e739', nf: '360679', qty: '275,00', location: "-20.312787, -40.393461" },
  { resp: 'lindainestaurino@gmail.com', id: '795abb6f', date: '10/1/25 16:50', type: 'TRUE', materialId: '334ed959', nf: '979049', qty: '50,00', location: "-20.309148, -40.290513" },
  { resp: 'lindainestaurino@gmail.com', id: '0f91cf63', date: '10/1/25 16:54', type: 'TRUE', materialId: 'f3bb3861', nf: '653235', qty: '2,00', location: "-20.309520, -40.290779" },
  { resp: 'arthursouzacabral187@gmail.com', id: '72030a2c', date: '9/29/25 21:44', type: 'FALSE', materialId: 'c547e739', nf: '906543', qty: '280,00', location: "-20.312779, -40.393454" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'b21f1afe', date: '9/29/25 21:46', type: 'FALSE', materialId: '61afd127', nf: '470076', qty: '400,00', location: "-20.312772, -40.393448" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'bbb480cb', date: '9/29/25 21:47', type: 'FALSE', materialId: '71b256e6', nf: '997310', qty: '400,00', location: "-20.312792, -40.393459" },
  { resp: 'arthursouzacabral187@gmail.com', id: '445aa37c', date: '10/1/25 21:49', type: 'FALSE', materialId: '25bffe29', nf: '027447', qty: '53,00', location: "-20.312792, -40.393456" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'f811d022', date: '10/1/25 21:51', type: 'FALSE', materialId: 'be63fdc0', nf: '890744', qty: '167,00', location: "-20.312792, -40.393456" },
  { resp: 'arthursouzacabral187@gmail.com', id: '502fffb0', date: '10/1/25 21:52', type: 'FALSE', materialId: '842d770c', nf: '821025', qty: '20,00', location: "-20.312792, -40.393456" },
  { resp: 'arthursouzacabral187@gmail.com', id: '525d3ee8', date: '10/1/25 21:52', type: 'FALSE', materialId: 'fea74349', nf: '205525', qty: '228,00', location: "-20.312776, -40.393450" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'bfddd0ab', date: '10/1/25 21:53', type: 'FALSE', materialId: '810a19f7', nf: '276488', qty: '25,00', location: "-20.312790, -40.393458" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'b75965f1', date: '10/1/25 21:54', type: 'FALSE', materialId: '73e9c262', nf: '256957', qty: '12,00', location: "-20.312792, -40.393465" },
  { resp: 'arthursouzacabral187@gmail.com', id: '9d3743e8', date: '10/1/25 21:55', type: 'FALSE', materialId: '90b62878', nf: '684379', qty: '90,00', location: "-20.312790, -40.393459" },
  { resp: 'arthursouzacabral187@gmail.com', id: 'b9bfac33', date: '10/1/25 21:56', type: 'FALSE', materialId: '9a9ba827', nf: '312271', qty: '66,00', location: "-20.312791, -40.393460" },
  { resp: 'lindainestaurino@gmail.com', id: 'f2b000e2', date: '10/1/25 22:26', type: 'TRUE', materialId: 'c19d49b6', nf: '087301', qty: '35,00', location: "-20.277099, -40.327844" },
  { resp: 'imullerreis@gmail.com', id: 'd1987327', date: '9/1/25 11:15', type: 'FALSE', materialId: 'd71d2cdb', nf: '407010', qty: '2,00', location: "-20.323806, -40.372129" },
  { resp: 'imullerreis@gmail.com', id: '724bd8ba', date: '10/2/25 18:17', type: 'TRUE', materialId: 'd71d2cdb', nf: '407010', qty: '1,00', location: "-20.267060, -40.413517" },
  { resp: 'imullerreis@gmail.com', id: '82eed950', date: '10/2/25 18:20', type: 'FALSE', materialId: '81c7e01f', nf: '678567', qty: '50,00', location: "-20.267103, -40.413497" },
  { resp: 'imullerreis@gmail.com', id: '8ba67931', date: '10/2/25 18:22', type: 'TRUE', materialId: '81c7e01f', nf: '678903', qty: '20,00', location: "-20.267104, -40.413498" },
  { resp: 'imullerreis@gmail.com', id: '5fc36e85', date: '10/2/25 18:24', type: 'FALSE', materialId: '52dc4502', nf: '678345', qty: '100,00', location: "-20.267106, -40.413499" },
  { resp: 'imullerreis@gmail.com', id: 'f8f13c08', date: '10/2/25 18:28', type: 'TRUE', materialId: '52dc4502', nf: '456789', qty: '50,00', location: "-20.267108, -40.413500" },
  { resp: 'imullerreis@gmail.com', id: 'aa8bc145', date: '10/2/25 18:29', type: 'FALSE', materialId: '71bfe3d8', nf: '456789', qty: '100,00', location: "-20.267110, -40.413502" },
  { resp: 'imullerreis@gmail.com', id: '0e29a5a6', date: '10/2/25 18:30', type: 'TRUE', materialId: '71bfe3d8', nf: '134246', qty: '10,00', location: "-20.267111, -40.413504" },
];


// --- DATA PERSISTENCE & PROCESSING ---

const DB_KEY = 'rilan_db';

// Helper function to guess category from description
const getCategory = (description: string): string => {
    const d = description.toLowerCase();
    
    if (['pvc', 'tubo', 'conexão'].some(k => d.includes(k))) return 'HIDRÁULICO';
    if (['fio', 'cabo'].some(k => d.includes(k))) return 'ELÉTRICO';
    if (['cimento', 'areia', 'brita', 'pedrisco', 'bloco', 'tijolo', 'vergalhão', 'tela', 'laje'].some(k => d.includes(k))) return 'ESTRUTURAL';
    if (['piso', 'telha', 'rejunte', 'tinta', 'massa', 'argamassa', 'drywall', 'porta'].some(k => d.includes(k))) return 'ACABAMENTO';

    return 'OUTROS';
};

const processInitialData = () => {
    // Utility to parse '1.234,56' into 1234.56
    const parseFloatBRL = (value: string) => parseFloat(value.replace(/\./g, '').replace(',', '.'));
    
    const suppliers: Supplier[] = rawSuppliers.map(s => ({ ...s }));
    const suppliersMap = new Map<string, Supplier>(suppliers.map(s => [s.id, s]));
    const defaultSupplier: Supplier = { id: 'unknown', name: 'Desconhecido', cnpj: '', phone: '', email: '' };

    const initialUsers: User[] = [
        { id: 1, name: 'Gerente Rilan', email: 'gerente@rilan.com', role: Role.Gerente, active: true, createdAt: '2023-01-01T10:00:00Z' },
        { id: 2, name: 'Operador Rilan', email: 'operador@rilan.com', role: Role.Operador, active: true, createdAt: '2023-01-02T11:00:00Z' },
        { id: 3, name: 'Linda Ines Taurino', email: 'lindainestaurino@gmail.com', role: Role.Operador, active: true, createdAt: '2023-09-01T10:00:00Z' },
        { id: 4, name: 'Arthur Souza Cabral', email: 'arthursouzacabral187@gmail.com', role: Role.Operador, active: true, createdAt: '2023-09-01T11:00:00Z' },
        { id: 5, name: 'Imuller Reis', email: 'imullerreis@gmail.com', role: Role.Operador, active: true, createdAt: '2023-09-01T12:00:00Z' },
    ];
    const users = new Map(initialUsers.map(u => [u.email, u]));

    const stockLevels = new Map<string, number>();
    rawMovements.forEach(m => {
        const qty = m.type === 'TRUE' ? -parseFloatBRL(m.qty) : parseFloatBRL(m.qty);
        const currentStock = stockLevels.get(m.materialId) || 0;
        stockLevels.set(m.materialId, currentStock + qty);
    });

    const materialsMap = new Map<string, Omit<Material, 'id'>>();
    const materialHexIdToNumericId = new Map<string, number>();
    
    let materialNumericId = 1;
    rawMaterials.forEach(rm => {
        const supplier = suppliersMap.get(rm.supplierId);
        const currentStock = stockLevels.get(rm.id) || 0;
        const avgCost = parseFloatBRL(rm.price);

        let controlStatus: string;
        if (currentStock < 50) {
            controlStatus = 'ESTOQUE BAIXO!';
        } else if (currentStock === 50) {
            controlStatus = 'ESTOQUE RAZOÁVEL';
        } else {
            controlStatus = 'ESTOQUE BOM';
        }
        
        const purchaseRecommendation = controlStatus === 'ESTOQUE BAIXO!' ? 'COMPRA IMEDIATA' : controlStatus === 'ESTOQUE RAZOÁVEL' ? 'TALVEZ' : 'NÃO';

        materialsMap.set(rm.id, {
            code: `MAT-${String(materialNumericId).padStart(4, '0')}`,
            description: rm.description.split('|')[0].trim(),
            category: getCategory(rm.description),
            unit: rm.unit,
            minStock: 50,
            currentStock: currentStock,
            supplier: supplier || defaultSupplier,
            avgCost: avgCost,
            controlStatus,
            purchaseRecommendation,
            stockValue: currentStock * avgCost,
        });
        materialHexIdToNumericId.set(rm.id, materialNumericId);
        materialNumericId++;
    });

    const materials: Material[] = Array.from(materialsMap.entries()).map(([hexId, m]) => ({
        id: materialHexIdToNumericId.get(hexId)!,
        ...m,
    }));

    const parseDate = (dateStr: string): string => {
        const [datePart, timePart] = dateStr.split(' ');
        const [month, day, year] = datePart.split('/');
        const [hour, minute] = timePart.split(':');
        const date = new Date(parseInt(`20${year}`), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        return isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
    };

    const parseLocation = (locStr?: string): { lat: number; lon: number } | undefined => {
        if (!locStr) return undefined;
        const [lat, lon] = locStr.split(',').map(s => parseFloat(s.trim()));
        if (!isNaN(lat) && !isNaN(lon)) {
            return { lat, lon };
        }
        return undefined;
    };

    let movementNumericId = 1;
    const stockMovements: StockMovement[] = rawMovements.map(rm => {
        const materialInfo = materials.find(m => m.id === materialHexIdToNumericId.get(rm.materialId));
        const userInfo = users.get(rm.resp);
        
        return {
            id: movementNumericId++,
            materialId: materialHexIdToNumericId.get(rm.materialId)!,
            materialCode: materialInfo?.code || 'N/A',
            materialDescription: materialInfo?.description || 'Material não encontrado',
            supplierName: materialInfo?.supplier.name,
            type: rm.type === 'FALSE' ? MovementType.Entrada : MovementType.Saida,
            reason: rm.type === 'FALSE' ? MovementReason.Compra : MovementReason.Venda,
            quantity: parseFloatBRL(rm.qty),
            unitCost: materialInfo?.avgCost || 0,
            movedAt: parseDate(rm.date),
            createdBy: userInfo?.name || rm.resp,
            docRef: rm.nf,
            location: parseLocation(rm.location),
        };
    });

    let auditLogNumericId = 1;
    const auditLogs: AuditLog[] = stockMovements.map(sm => ({
        id: auditLogNumericId++,
        user: sm.createdBy,
        action: 'CREATE',
        entity: 'StockMovement',
        entityId: sm.id,
        timestamp: sm.movedAt,
        details: `Movimentação de ${sm.type} (${sm.reason}) de ${sm.quantity} unidade(s) do material ${sm.materialCode}.`,
    }));
    
    auditLogs.push({id: auditLogNumericId++, user: 'Gerente Rilan', action: 'LOGIN', entity: 'User', entityId: 1, timestamp: new Date().toISOString(), details: 'Login realizado com sucesso.' });
    auditLogs.push({id: auditLogNumericId++, user: 'Arthur Souza Cabral', action: 'LOGIN', entity: 'User', entityId: 4, timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Login realizado com sucesso.' });

    return { users: initialUsers, suppliers, materials, stockMovements, auditLogs };
};

const loadOrInitializeDB = () => {
    try {
        const savedDb = localStorage.getItem(DB_KEY);
        if (savedDb) {
            return JSON.parse(savedDb);
        }
    } catch (error) {
        console.error("Failed to load or parse DB from localStorage. Reinitializing.", error);
        localStorage.removeItem(DB_KEY);
    }
    
    const initialDb = processInitialData();
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
    } catch (error) {
        console.error("Failed to save initial DB to localStorage", error);
    }
    return initialDb;
};


let DB = loadOrInitializeDB();

const updateAndSaveDb = (newDbState: Partial<typeof DB>) => {
    DB = { ...DB, ...newDbState };
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(DB));
    } catch (error) {
        console.error("Failed to save DB to localStorage", error);
    }
};


// --- MOCK API FUNCTIONS ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const apiLogin = async (email: string, pass: string): Promise<User> => {
    await delay(500);
    const user = DB.users.find(u => u.email === email);
    if (user && pass === 'Senha!123' && user.active) return user;
    if (user && !user.active) throw new Error('Usuário inativo.');
    throw new Error('Email ou senha inválidos.');
};

export const apiLogout = async (): Promise<void> => {
    await delay(100);
    return;
};

export const apiGetMaterials = async (): Promise<Material[]> => {
    await delay(500);
    return [...DB.materials];
};

export const apiGetSuppliers = async (): Promise<Supplier[]> => {
    await delay(200);
    return [...DB.suppliers];
}

export const apiGetStockMovements = async (): Promise<StockMovement[]> => {
    await delay(500);
    return [...DB.stockMovements].sort((a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime());
};

export const apiGetUsers = async (): Promise<User[]> => {
    await delay(500);
    return [...DB.users];
};

export const apiGetAuditLogs = async (): Promise<AuditLog[]> => {
    await delay(500);
    return [...DB.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const updateMaterialStatus = (material: Material): Material => {
    const newMaterial = { ...material };
    if (newMaterial.currentStock < newMaterial.minStock) {
        newMaterial.controlStatus = 'ESTOQUE BAIXO!';
        newMaterial.purchaseRecommendation = 'COMPRA IMEDIATA';
    } else if (newMaterial.currentStock === newMaterial.minStock) {
        newMaterial.controlStatus = 'ESTOQUE RAZOÁVEL';
        newMaterial.purchaseRecommendation = 'TALVEZ';
    } else {
        newMaterial.controlStatus = 'ESTOQUE BOM';
        newMaterial.purchaseRecommendation = 'NÃO';
    }
    newMaterial.stockValue = newMaterial.currentStock * newMaterial.avgCost;
    return newMaterial;
}

export const apiUpdateMaterial = async (materialId: number, data: Partial<Pick<Material, 'description' | 'minStock'>>): Promise<Material> => {
    await delay(500);
    const materialIndex = DB.materials.findIndex(m => m.id === materialId);
    if (materialIndex === -1) {
        throw new Error('Material not found');
    }
    const originalMaterial = DB.materials[materialIndex];
    
    const updatedMaterialRaw: Material = {
        ...originalMaterial,
        ...data,
    };

    const updatedMaterial = updateMaterialStatus(updatedMaterialRaw);
    
    const newMaterials = [...DB.materials];
    newMaterials[materialIndex] = updatedMaterial;

    let newMovements = DB.stockMovements;
     if (data.description && data.description !== originalMaterial.description) {
        newMovements = DB.stockMovements.map(sm => {
            if (sm.materialId === materialId) {
                return { ...sm, materialDescription: data.description! };
            }
            return sm;
        });
    }

    updateAndSaveDb({ materials: newMaterials, stockMovements: newMovements });
    return updatedMaterial;
};

export const apiUpdateUser = async (userId: number, data: Partial<Pick<User, 'name' | 'email' | 'role'>>): Promise<User> => {
    await delay(500);
    const userIndex = DB.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('User not found');
    }
    const updatedUser: User = {
        ...DB.users[userIndex],
        ...data,
    };
    
    const newUsers = [...DB.users];
    newUsers[userIndex] = updatedUser;

    updateAndSaveDb({ users: newUsers });
    return updatedUser;
};

export const apiToggleUserStatus = async (userId: number): Promise<User> => {
    await delay(500);
    const userIndex = DB.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('User not found');
    }
    const user = DB.users[userIndex];
    if (user.role === Role.Gerente && DB.users.filter(u => u.role === Role.Gerente && u.active).length === 1 && user.active) {
        throw new Error('Não é possível desativar o único gerente ativo.');
    }
    
    const updatedUser = { ...user, active: !user.active };
    const newUsers = [...DB.users];
    newUsers[userIndex] = updatedUser;

    updateAndSaveDb({ users: newUsers });
    return updatedUser;
};


export const apiAddMaterial = async (data: Omit<Material, 'id' | 'code' | 'controlStatus' | 'purchaseRecommendation' | 'stockValue' | 'currentStock' | 'supplier'> & { supplierId: string, initialStock: number }): Promise<Material> => {
    await delay(600);
    const newId = DB.materials.length > 0 ? Math.max(...DB.materials.map(m => m.id)) + 1 : 1;
    const supplier = DB.suppliers.find(s => s.id === data.supplierId);
    if(!supplier) throw new Error('Supplier not found');

    let newMaterial: Material = {
        id: newId,
        code: `MAT-${String(newId).padStart(4, '0')}`,
        description: data.description,
        category: getCategory(data.description),
        unit: data.unit,
        minStock: data.minStock,
        currentStock: data.initialStock,
        supplier: supplier,
        avgCost: data.avgCost,
        controlStatus: '', 
        purchaseRecommendation: '',
        stockValue: 0,
    };

    newMaterial = updateMaterialStatus(newMaterial);
    
    updateAndSaveDb({ materials: [...DB.materials, newMaterial] });

    if (data.initialStock > 0) {
        await apiAddMovement({
            materialId: newId,
            type: MovementType.Entrada,
            reason: MovementReason.AjustePositivo,
            quantity: data.initialStock,
            docRef: 'SALDO_INICIAL',
            note: 'Cadastro inicial de material'
        }, {id: 1, name: 'SISTEMA', email: '', role: Role.Gerente, active: true, createdAt: '' });
    }

    return newMaterial;
}

export const apiAddMovement = async (data: any, user: User): Promise<StockMovement> => {
    await delay(600);
    const materialIndex = DB.materials.findIndex(m => m.id === data.materialId);
    if(materialIndex === -1) throw new Error("Material not found");

    const originalMaterial = DB.materials[materialIndex];
    const quantityChange = data.type === MovementType.Entrada ? data.quantity : -data.quantity;
    
    const updatedMaterial = updateMaterialStatus({
        ...originalMaterial,
        currentStock: originalMaterial.currentStock + quantityChange,
    });

    const newMaterials = [...DB.materials];
    newMaterials[materialIndex] = updatedMaterial;

    let supplierName: string | undefined = originalMaterial.supplier.name;
    if (data.supplierId) {
        const supplier = DB.suppliers.find(s => s.id === data.supplierId);
        if (supplier) {
            supplierName = supplier.name;
        }
    }

    const newId = DB.stockMovements.length > 0 ? Math.max(...DB.stockMovements.map(m => m.id)) + 1 : 1;
    const newMovement: StockMovement = {
        id: newId,
        materialId: originalMaterial.id,
        materialCode: originalMaterial.code,
        materialDescription: originalMaterial.description,
        type: data.type,
        reason: data.reason,
        quantity: data.quantity,
        unitCost: originalMaterial.avgCost,
        movedAt: new Date().toISOString(),
        createdBy: user.name,
        docRef: data.docRef,
        note: data.note,
        location: data.location,
        supplierName: supplierName,
    };
    
    const newMovements = [...DB.stockMovements, newMovement];
    updateAndSaveDb({ materials: newMaterials, stockMovements: newMovements });

    return newMovement;
};

export const apiReverseMovement = async (movementId: number, user: User): Promise<StockMovement> => {
    await delay(600);
    const originalMovement = DB.stockMovements.find(m => m.id === movementId);
    if (!originalMovement) throw new Error("Movimentação original não encontrada.");
    if (originalMovement.type !== MovementType.Saida) throw new Error("Apenas movimentações de saída podem ser estornadas.");
    if (originalMovement.reason === MovementReason.Estorno) throw new Error("Uma movimentação de estorno não pode ser estornada.");

    const existingReversal = DB.stockMovements.find(m => m.reason === MovementReason.Estorno && m.docRef === `ESTORNO_ID_${movementId}`);
    if(existingReversal) throw new Error("Esta movimentação já foi estornada.");

    const materialIndex = DB.materials.findIndex(m => m.id === originalMovement.materialId);
    if(materialIndex === -1) throw new Error("Material da movimentação não encontrado");

    const originalMaterial = DB.materials[materialIndex];
    const updatedMaterial = updateMaterialStatus({
        ...originalMaterial,
        currentStock: originalMaterial.currentStock + originalMovement.quantity,
    });
    
    const newMaterials = [...DB.materials];
    newMaterials[materialIndex] = updatedMaterial;

    const newId = DB.stockMovements.length > 0 ? Math.max(...DB.stockMovements.map(m => m.id)) + 1 : 1;
    const newMovement: StockMovement = {
        id: newId,
        materialId: originalMaterial.id,
        materialCode: originalMaterial.code,
        materialDescription: originalMaterial.description,
        type: MovementType.Entrada,
        reason: MovementReason.Estorno,
        quantity: originalMovement.quantity,
        unitCost: originalMaterial.avgCost,
        movedAt: new Date().toISOString(),
        createdBy: user.name,
        docRef: `ESTORNO_ID_${movementId}`,
        note: `Estorno da movimentação #${movementId}`,
        location: originalMovement.location,
        supplierName: originalMovement.supplierName,
    };
    
    const newMovements = [...DB.stockMovements, newMovement];
    updateAndSaveDb({ materials: newMaterials, stockMovements: newMovements });

    return newMovement;
};


export const apiGetAiSummary = async (materials: Material[]): Promise<string> => {
    await delay(1000); // Simulate API latency

    /*
    // This is how you would use the Gemini API in a real environment
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const itemsBelowMin = materials.filter(m => m.currentStock < m.minStock);
        const prompt = `Analise os seguintes dados de estoque e forneça um resumo conciso (2-3 frases) em português sobre a situação atual. Destaque os pontos mais críticos e sugira ações. Itens com estoque baixo: ${JSON.stringify(itemsBelowMin.map(i => ({ descricao: i.description, estoque: i.currentStock, minimo: i.minStock })))}. Total de itens: ${materials.length}.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed", error);
        return "Não foi possível obter a análise da IA no momento.";
    }
    */
    
    // Mocked response for demonstration
    const itemsBelowMin = materials.filter(m => m.currentStock < m.minStock);
    if (itemsBelowMin.length > 5) {
        return "Atenção! Vários itens críticos estão com estoque baixo, especialmente materiais estruturais. Recomenda-se compra imediata para evitar paralisações. O valor total do estoque está em um nível razoável.";
    } else if (itemsBelowMin.length > 0) {
         return `Situação de estoque gerenciável. Apenas ${itemsBelowMin.length} item(ns) estão abaixo do mínimo, requerendo atenção pontual. Monitore os níveis para evitar problemas futuros.`;
    } else {
        return "Parabéns! Todos os itens estão com níveis de estoque saudáveis e acima do mínimo definido. O controle de inventário está excelente.";
    }
};

// --- AI Chat Functions ---
let chat: Chat | null = null;
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const initializeChat = async () => {
    const materials = await apiGetMaterials();
    const movements = await apiGetStockMovements();
    const suppliers = await apiGetSuppliers();

    const systemInstruction = `Você é um assistente de IA para o sistema de controle de estoque RILAN. Seu nome é Rilan AI. Responda em português. Use os dados de contexto fornecidos para responder às perguntas do usuário sobre materiais, movimentações, fornecedores e o estado geral do estoque. Seja conciso e prestativo. A data atual é ${new Date().toLocaleDateString('pt-BR')}. Aqui estão os dados atuais do sistema: \n\nMATERIAIS:\n${JSON.stringify(materials.slice(0, 20))}\n\nMOVIMENTAÇÕES RECENTES:\n${JSON.stringify(movements.slice(0, 20))}\n\nFORNECEDORES:\n${JSON.stringify(suppliers)}`;

    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        }
    });
};

export const apiGetAiChatResponse = async (message: string): Promise<string> => {
    if (!chat) {
        await initializeChat();
    }
    
    try {
        const response = await chat!.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Gemini chat error:", error);
        return "Desculpe, não consegui processar sua solicitação no momento.";
    }
};

export const apiGetSalesForecast = async (movements: StockMovement[]): Promise<SalesForecast[]> => {
    const salesMovements = movements
        .filter(m => m.type === MovementType.Saida)
        .map(({ materialDescription, quantity, movedAt }) => ({ materialDescription, quantity, movedAt }));
    
    if(salesMovements.length === 0) return [];
    
    const prompt = `Analise os seguintes dados de movimentações de saída (vendas) de um estoque de materiais de construção. Com base nas tendências de quantidade, frequência e data das vendas, preveja quais serão os 5 materiais mais vendidos no próximo mês. Forneça uma breve justificativa para cada previsão. Os dados são: ${JSON.stringify(salesMovements.slice(0, 100))}`; // Limit context size

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        forecast: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    materialDescription: { type: Type.STRING },
                                    predictedRank: { type: Type.INTEGER },
                                    justification: { type: Type.STRING },
                                },
                            },
                        },
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        const parsedJson = JSON.parse(jsonStr);
        return parsedJson.forecast || [];

    } catch (error) {
         console.error("Gemini forecast error:", error);
         // Return a mock response in case of error
         return [
            { materialDescription: 'Vergalhão CA-50 10 mm (3/8")', predictedRank: 1, justification: 'Alta frequência e volume de saídas recentes.' },
            { materialDescription: 'Conexões PVC (joelho, T, luva)', predictedRank: 2, justification: 'Saídas constantes e em grande quantidade.' },
            { materialDescription: 'Tijolo cerâmico 19x19x39', predictedRank: 3, justification: 'Vendas consistentes para obras de alvenaria.' },
            { materialDescription: 'Massa corrida (lata 18 L)', predictedRank: 4, justification: 'Item popular em fases de acabamento, com boa saída.' },
            { materialDescription: 'Fio / cabo elétrico 2,5 mm²', predictedRank: 5, justification: 'Saída regular para instalações elétricas.' },
        ];
    }
};