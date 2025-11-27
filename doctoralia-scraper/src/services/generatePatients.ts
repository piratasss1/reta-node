import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

export async function generatePatients(numPatients: number = 40) {
    for (let i = 0; i < numPatients; i++) {
        const patient = await prisma.patients.create({
            data: {
                full_name: faker.name.fullName(),
                document_number: faker.datatype.uuid().slice(0, 32),
                phone_number: faker.phone.number('##########'),
                email: faker.internet.email(),
            },
        });

        console.log(`Paciente creado: ${patient.full_name}`);
    }
}