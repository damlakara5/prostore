import {PrismaClient} from "@prisma/client/edge";
import sampleData from "./sample-data";

async function main() {
    const prisma = new PrismaClient();
    await prisma.product.deleteMany(); //delete everything on the table before adding data
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();

    await prisma.product.createMany({data: sampleData.products})
    await prisma.user.createMany({data: sampleData.users})

    console.log('Db seeded successfully')
}

main()