import {Pool} from 'pg'


 const pool=new Pool({
    host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Optional tuning
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query(text:string,params?:unknown[]){
    return pool.query(text,params);

}
export default pool;