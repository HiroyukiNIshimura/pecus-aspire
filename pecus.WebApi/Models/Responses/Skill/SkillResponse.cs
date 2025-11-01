namespace Pecus.Models.Responses.Skill;

/// <summary>
/// �X�L���ڍ׏�񃌃X�|���X
/// </summary>
public class SkillDetailResponse
{
    /// <summary>
    /// �X�L��ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// �X�L����
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// �X�L���̐���
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// �g�DID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// �쐬����
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// �쐬�҃��[�U�[ID
    /// </summary>
    public int? CreatedByUserId { get; set; }

    /// <summary>
    /// �X�V����
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// �X�V�҃��[�U�[ID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// �A�N�e�B�u�t���O
    /// </summary>
    public bool IsActive { get; set; }
}

/// <summary>
/// �X�L�����X�g�A�C�e�����X�|���X
/// </summary>
public class SkillListItemResponse
{
    /// <summary>
    /// �X�L��ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// �X�L����
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// �X�L���̐���
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// �쐬����
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// �X�V����
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// �A�N�e�B�u�t���O
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// ���̃X�L����ۗL���Ă��郆�[�U�[��
    /// </summary>
    public int UserCount { get; set; }
}

/// <summary>
/// �X�L���쐬�E�X�V���X�|���X
/// </summary>
public class SkillResponse
{
    /// <summary>
    /// �����t���O
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// ���b�Z�[�W
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// �X�L�����i�I�v�V�����j
    /// </summary>
    public SkillDetailResponse? Skill { get; set; }
}
