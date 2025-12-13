using System.Text.Json.Serialization;

namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// ログイン後のランディングページを表す列挙型
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<LandingPage>))]
public enum LandingPage
{
    /// <summary>
    /// ダッシュボード（デフォルト）
    /// </summary>
    Dashboard = 1,

    /// <summary>
    /// マイワークスペース
    /// </summary>
    Workspace = 2,

    /// <summary>
    /// マイアイテム
    /// </summary>
    MyItems = 3,

    /// <summary>
    /// タスク
    /// </summary>
    Tasks = 4,

    /// <summary>
    /// コミッター
    /// </summary>
    Committer = 5,
}
