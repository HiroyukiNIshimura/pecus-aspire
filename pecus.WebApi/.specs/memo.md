pecus.WebApi/Controllers/Admin/AdminUserControllerにユーザーを登録するエンドポイントを作成。
ユーザーの登録時のリクエストは
* メールアドレス
* ユーザー名

ユーザー登録を実行する際にはログインIDを自動採番する。
> UserService#GenerateUniqueLoginIdAsyncメソッドを利用

DBへの登録が完了したら登録ユーザーのメールアドレスへパスワード要求メールを送信する。


Controllers/Entranceにユーザーのパスワード登録用のエンドポイントを作成する。



