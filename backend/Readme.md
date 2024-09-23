# Backend

## Database ORM generation
The structs are generated automatically from the database with the following command:
```shell
sea-orm-cli generate entity --database-url $POSTGRES_URL -o src/entity --model-extra-derives Serialize,Deserialize,ToSchema
 ```
