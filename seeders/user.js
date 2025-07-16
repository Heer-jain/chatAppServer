import { User } from '../models/user.js'
import { faker } from '@faker-js/faker'

const createUser = async(numUsers) => {
    try {
        const UserPromise = []        

        for (let index = 0; index < numUsers; index++) {
            const tempUser = User.create({
                name: faker.person.fullName(),
                username: faker.internet.username(),
                password: "password",
                bio: faker.lorem.sentence(10),
                avatar: {
                    url: faker.image.avatar(),
                    public_id: faker.system.fileName()
                },
                email: faker.internet.email()
            })
            UserPromise.push(tempUser)

            await Promise.all(UserPromise)

            console.log("User Create", numUsers)
            process.exit(1)
        }

    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

export { createUser }