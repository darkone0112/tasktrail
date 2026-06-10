const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const TOKEN_TYPES = [
    { name: 'verify' },
    { name: 'recover' },
]

async function main() {
    for (const [index, token] of TOKEN_TYPES.entries()) {
        await prisma.tokenTypes.upsert({
            where: { id: index + 1 },
            update: {},
            create: {
                name: token.name,
            }
        })
    }

    const adminCount = await prisma.users.count({
        where: {
            role: 'ADMIN',
            disabled: false
        }
    })

    if (adminCount === 0) {
        const firstUser = await prisma.users.findFirst({
            where: { disabled: false },
            orderBy: { id: 'asc' }
        })

        if (firstUser) {
            await prisma.users.update({
                where: { id: firstUser.id },
                data: { role: 'ADMIN' }
            })
        }
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })

    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
