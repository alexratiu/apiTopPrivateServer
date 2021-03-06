import UserType from '../UserType';
import {
    GraphQLString,
    GraphQLNonNull,
} from 'graphql';
import sendMail from '../../../../utils/mail';
import InternalServerError from '../../../../utils/errors/InternalServerError';

const registerUser = {
    type: UserType,
    args: {
        firstName: {
            type: GraphQLString
        },
        lastName: {
            type: GraphQLString
        },
        email: {
            type: new GraphQLNonNull(GraphQLString)
        },
        password: {
            type: new GraphQLNonNull(GraphQLString)
        },
        updatedAt: {
            type: GraphQLString,
        },
        createdAt: {
            type: GraphQLString,
        },
    },
    resolve: async (parent, args, {
        mongo: {
            User
        }
    }) => {
        const user = await new User(args);

        // bcrypt password from args
        user.password = await user.encryptPassword(args.password);

        // create session Token
        const sessionToken = await user.createSessionToken();

        user.sessionToken = sessionToken;

        await user.save();

        try {
            sendMail({
                to: user.email,
                from: 'contact@raulratiu.me',
                subject: 'Welcome to MyProject',
                context: {
                    templateName: '/register/',
                    args: {
                        email: user.email,
                        title: 'Welcome',
                    },

                },
            });
        } catch (e) {
            throw new InternalServerError({
                message: e.message,
            });
        }

        return user;
    }
}

export default registerUser;