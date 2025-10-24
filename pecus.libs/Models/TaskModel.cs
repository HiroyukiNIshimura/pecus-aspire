namespace pecus.Libs.Models
{
    public class TaskModel
    {
        public TaskModel()
        {
            Status = "CREATED";
            Result = null;
        }

        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string Status { get; set; }
        public string? Result { get; set; }
    }
}
