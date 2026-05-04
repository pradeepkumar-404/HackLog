import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  }
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite connected');
    await sequelize.sync({ alter: false });
    console.log('✅ Database synced');
  } catch (error) {
    console.error('❌ DB connection error:', error);
    process.exit(1);
  }
};

export default sequelize;